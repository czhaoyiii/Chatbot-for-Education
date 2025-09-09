import os
import uuid
import random
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from pydantic import BaseModel, Field
from fastapi import HTTPException
from openai import AsyncOpenAI
import json

# Initialize Supabase (lazy initialization)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Initialize OpenAI client (lazy initialization)
def get_openai_client():
    return AsyncOpenAI()

class QuizQuestion(BaseModel):
    question_text: str = Field(..., description="The question text")
    correct_answer: str = Field(..., description="The correct answer")
    wrong_answers: List[str] = Field(..., description="List of 3 wrong answers", min_items=3, max_items=3)
    explanation: str = Field(..., description="Explanation based on the document content")
    difficulty: str = Field(..., description="Either 'simple' or 'scenario'")

class QuizGenerationResponse(BaseModel):
    topic_title: str = Field(..., description="Topic title based on filename and content")
    questions: List[QuizQuestion] = Field(..., description="List of quiz questions (20-40)", min_items=20, max_items=40)

class QuizGenerationRequest(BaseModel):
    course_id: str
    course_file_id: str
    filename: str
    content: str
    user_email: str

def randomize_options(correct_answer: str, wrong_answers: List[str]) -> Dict[str, str]:
    """
    Randomize the order of options and return the mapping with correct answer position
    """
    all_options = [correct_answer] + wrong_answers
    random.shuffle(all_options)
    
    option_labels = ['A', 'B', 'C', 'D']
    randomized_options = {}
    correct_position = None
    
    for i, option in enumerate(all_options):
        randomized_options[f'option_{option_labels[i].lower()}'] = option
        if option == correct_answer:
            correct_position = option_labels[i]
    
    randomized_options['correct_answer'] = correct_position
    return randomized_options

def chunk_content_for_llm(content: str, max_chunk_size: int = 50000) -> List[str]:
    """
    Split content into chunks if it's too large for LLM context
    Reduced max_chunk_size to be more conservative with token limits
    """
    if len(content) <= max_chunk_size:
        return [content]
    
    # Split by sections or paragraphs
    chunks = []
    lines = content.split('\n')
    current_chunk = ""
    
    for line in lines:
        if len(current_chunk) + len(line) + 1 > max_chunk_size:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = line
            else:
                # Single line is too long, force split
                chunks.append(line[:max_chunk_size])
                current_chunk = line[max_chunk_size:]
        else:
            current_chunk += "\n" + line if current_chunk else line
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

async def generate_quiz_with_llm(filename: str, content: str) -> QuizGenerationResponse:
    """
    Use LLM to generate quiz questions based on file content
    """
    try:
        print(f"Starting quiz generation for file: {filename}")
        
        # Validate content length
        if len(content.strip()) < 100:
            raise HTTPException(status_code=400, detail="Content too short to generate meaningful quiz questions")
        
        # Chunk content if too large
        content_chunks = chunk_content_for_llm(content)
        print(f"Content split into {len(content_chunks)} chunks")
        
        if len(content_chunks) == 1:
            # Single chunk, process normally
            quiz_data = await _generate_quiz_single_chunk(filename, content_chunks[0])
        else:
            # Multiple chunks, need to process differently
            quiz_data = await _generate_quiz_multiple_chunks(filename, content_chunks)
        
        print(f"Successfully generated quiz with {len(quiz_data.questions)} questions for {filename}")
        return quiz_data
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating quiz for {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating quiz with LLM: {str(e)}")

async def _generate_quiz_single_chunk(filename: str, content: str) -> QuizGenerationResponse:
    """
    Generate quiz for a single content chunk
    """
    openai_client = get_openai_client()
    
    system_prompt = """You are an expert educator creating comprehensive quiz questions based on educational content.

Your task is to return a JSON object with exactly this structure:
{
  "topic_title": "A descriptive title based on filename and content",
  "questions": [
    {
      "question_text": "The question text",
      "correct_answer": "The correct answer",
      "wrong_answers": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
      "explanation": "Explanation based on the document",
      "difficulty": "simple"
    }
  ]
}

Requirements:
- Generate exactly 40 questions (20 with difficulty "simple", 20 with difficulty "scenario")
- Each question must have exactly 3 wrong_answers and 1 correct_answer
- Topic title should reflect the content (e.g., "Lecture 1 - Introduction to Networks")
- Questions should test understanding of the material
- Wrong answers should be plausible but clearly incorrect
- Explanations should reference the source material

IMPORTANT: Return ONLY the JSON object, no additional text."""

    user_prompt = f"""
Based on this file content, generate a quiz with exactly 40 questions:

Filename: {filename}
Content (first 30000 chars):
{content[:30000]}{"..." if len(content) > 30000 else ""}

Generate 20 simple questions and 20 scenario-based questions. Return as JSON with the exact structure specified.
"""

    try:
        # Retry logic for better reliability
        max_retries = 2
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                response = await openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                    max_tokens=16000
                )
                
                response_content = response.choices[0].message.content
                print(f"Raw LLM response (attempt {attempt + 1}): {response_content[:200]}...")  # Debug log
                
                quiz_data = json.loads(response_content)
                
                # Validate and fix the structure if needed
                if "topic" in quiz_data and "topic_title" not in quiz_data:
                    quiz_data["topic_title"] = quiz_data.pop("topic")
                
                # Handle different question structures
                if "questions" not in quiz_data:
                    # Check if questions are categorized by difficulty
                    all_questions = []
                    if "simple" in quiz_data:
                        for q in quiz_data["simple"]:
                            q["difficulty"] = "simple"
                            all_questions.append(q)
                    if "scenario" in quiz_data:
                        for q in quiz_data["scenario"]:
                            q["difficulty"] = "scenario"
                            all_questions.append(q)
                    quiz_data["questions"] = all_questions
                
                # Validate that we have some questions
                questions = quiz_data.get("questions", [])
                if len(questions) >= 15:  # Accept if we have at least 15 questions
                    break
                else:
                    raise ValueError(f"Insufficient questions in attempt {attempt + 1}: {len(questions)}")
                    
            except Exception as e:
                last_exception = e
                print(f"Attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise last_exception
                # Wait briefly before retry
                await asyncio.sleep(1)
        
        # Ensure all questions have the required fields
        for i, question in enumerate(questions):
            if "difficulty" not in question:
                question["difficulty"] = "simple" if i < len(questions) // 2 else "scenario"
        
        # If we don't have exactly 40 questions, try to generate more or fail gracefully
        if len(questions) < 40:
            print(f"Warning: Only {len(questions)} questions generated, expected 40. Attempting to generate additional questions...")
            
            # Try to generate additional questions with a focused prompt
            additional_needed = 40 - len(questions)
            try:
                additional_questions = await _generate_additional_questions(
                    filename, content, additional_needed, questions
                )
                questions.extend(additional_questions)
                print(f"Successfully generated {len(additional_questions)} additional questions")
            except Exception as e:
                print(f"Failed to generate additional questions: {e}")
                # If we have at least 20 questions, proceed with what we have
                if len(questions) >= 20:
                    print(f"Proceeding with {len(questions)} questions (minimum threshold met)")
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Insufficient questions generated ({len(questions)}/40). Minimum 20 required."
                    )
        elif len(questions) > 40:
            print(f"Warning: {len(questions)} questions generated, trimming to 40")
            questions = questions[:40]
        
        quiz_data["questions"] = questions
        
        # Validate quiz quality before returning
        quiz_response = QuizGenerationResponse(**quiz_data)
        if not validate_quiz_quality(quiz_response):
            raise HTTPException(
                status_code=500, 
                detail="Generated quiz did not meet quality standards. Please try again or contact support."
            )
        
        return quiz_response
    
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from LLM: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation error: {str(e)}")

async def _generate_additional_questions(
    filename: str, 
    content: str, 
    additional_needed: int, 
    existing_questions: List[Dict]
) -> List[Dict]:
    """
    Generate additional questions when the initial LLM call didn't produce enough
    """
    openai_client = get_openai_client()
    
    # Extract topics from existing questions to avoid duplication
    existing_topics = []
    for q in existing_questions:
        question_text = q.get("question_text", "")
        # Extract key terms from question for context
        if len(question_text) > 20:
            existing_topics.append(question_text[:100])
    
    existing_context = "\n".join(existing_topics[:5]) if existing_topics else "No existing questions"
    
    system_prompt = f"""You are an expert educator. Generate exactly {additional_needed} additional multiple choice questions from the given content.

IMPORTANT: Avoid duplicating topics already covered in existing questions.

Return a JSON object with this exact structure:
{{
  "questions": [
    {{
      "question_text": "The question text",
      "correct_answer": "The correct answer",
      "wrong_answers": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
      "explanation": "Explanation based on the document",
      "difficulty": "simple"
    }}
  ]
}}

Requirements:
- Generate exactly {additional_needed} questions
- Focus on different aspects than existing questions
- Each question must have exactly 3 wrong_answers and 1 correct_answer
- Mix of "simple" and "scenario" difficulty levels
- Return ONLY the JSON object"""

    user_prompt = f"""
Content:
{content[:25000]}{"..." if len(content) > 25000 else ""}

Existing question topics (avoid duplicating):
{existing_context}

Generate {additional_needed} additional questions covering different aspects of the content.
"""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8,  # Slightly higher temperature for more variety
            max_tokens=8000
        )
        
        response_content = response.choices[0].message.content
        questions_data = json.loads(response_content)
        
        additional_questions = []
        questions_list = questions_data.get("questions", [])
        
        for i, q_data in enumerate(questions_list[:additional_needed]):
            # Assign difficulty (mix of simple and scenario)
            if "difficulty" not in q_data:
                q_data["difficulty"] = "scenario" if i % 2 == 0 else "simple"
            additional_questions.append(q_data)
        
        return additional_questions
        
    except Exception as e:
        print(f"Error generating additional questions: {e}")
        raise e

def validate_quiz_quality(quiz_data: QuizGenerationResponse) -> bool:
    """
    Validate the quality of generated quiz questions
    """
    try:
        # Check topic title
        if not quiz_data.topic_title or len(quiz_data.topic_title.strip()) < 5:
            print("Warning: Topic title is too short or empty")
            return False
        
        # Check questions
        if len(quiz_data.questions) < 20:
            print(f"Warning: Insufficient questions ({len(quiz_data.questions)}/20 minimum)")
            return False
        
        valid_questions = 0
        for i, question in enumerate(quiz_data.questions):
            # Validate question structure
            if not question.question_text or len(question.question_text.strip()) < 10:
                print(f"Warning: Question {i+1} has invalid question text")
                continue
                
            if not question.correct_answer or len(question.correct_answer.strip()) < 2:
                print(f"Warning: Question {i+1} has invalid correct answer")
                continue
                
            if len(question.wrong_answers) != 3:
                print(f"Warning: Question {i+1} doesn't have exactly 3 wrong answers")
                continue
                
            # Check for duplicate answers
            all_answers = [question.correct_answer] + question.wrong_answers
            if len(set(all_answers)) != 4:
                print(f"Warning: Question {i+1} has duplicate answers")
                continue
                
            if not question.explanation or len(question.explanation.strip()) < 10:
                print(f"Warning: Question {i+1} has insufficient explanation")
                continue
                
            valid_questions += 1
        
        quality_ratio = valid_questions / len(quiz_data.questions)
        print(f"Quiz quality: {valid_questions}/{len(quiz_data.questions)} valid questions ({quality_ratio:.2%})")
        
        return quality_ratio >= 0.8  # At least 80% of questions should be valid
        
    except Exception as e:
        print(f"Error validating quiz quality: {e}")
        return False

async def _generate_quiz_multiple_chunks(filename: str, content_chunks: List[str]) -> QuizGenerationResponse:
    """
    Generate quiz for multiple content chunks
    """
    openai_client = get_openai_client()
    
    # First, generate topic title from the first chunk
    topic_response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system", 
                "content": "Generate a topic title based on the filename and content. Return only the title."
            },
            {
                "role": "user", 
                "content": f"Filename: {filename}\n\nContent preview:\n{content_chunks[0][:2000]}..."
            }
        ],
        temperature=0.7,
        max_tokens=100
    )
    
    topic_title = topic_response.choices[0].message.content.strip()
    
    # Generate questions from chunks (distribute 40 questions across chunks)
    questions_per_chunk = max(1, 40 // len(content_chunks))
    remaining_questions = 40 - (questions_per_chunk * (len(content_chunks) - 1))
    
    all_questions = []
    
    for i, chunk in enumerate(content_chunks):
        chunk_questions = remaining_questions if i == len(content_chunks) - 1 else questions_per_chunk
        simple_questions = chunk_questions // 2
        scenario_questions = chunk_questions - simple_questions
        
        chunk_quiz = await _generate_chunk_questions(
            chunk, simple_questions, scenario_questions
        )
        all_questions.extend(chunk_quiz)
    
    # Ensure we have exactly the target number of questions (20-40)
    target_questions = min(40, max(20, len(all_questions)))
    
    if len(all_questions) > target_questions:
        all_questions = all_questions[:target_questions]
    elif len(all_questions) < 20:
        # Try to generate more questions from the largest chunk
        additional_needed = 20 - len(all_questions)
        largest_chunk = max(content_chunks, key=len)
        try:
            additional_questions = await _generate_chunk_questions(
                largest_chunk, additional_needed // 2, additional_needed - (additional_needed // 2)
            )
            all_questions.extend(additional_questions[:additional_needed])
        except Exception as e:
            print(f"Warning: Could not generate additional questions: {e}")
    
    quiz_response = QuizGenerationResponse(
        topic_title=topic_title,
        questions=all_questions
    )
    
    # Validate before returning
    if not validate_quiz_quality(quiz_response):
        raise HTTPException(
            status_code=500,
            detail="Generated quiz from multiple chunks did not meet quality standards"
        )
    
    return quiz_response

async def _generate_chunk_questions(content: str, simple_count: int, scenario_count: int) -> List[QuizQuestion]:
    """
    Generate specific number of questions from a content chunk
    """
    openai_client = get_openai_client()
    
    system_prompt = f"""Generate exactly {simple_count + scenario_count} multiple choice questions from the given content.

Return a JSON object with this exact structure:
{{
  "questions": [
    {{
      "question_text": "The question text",
      "correct_answer": "The correct answer",
      "wrong_answers": ["wrong answer 1", "wrong answer 2", "wrong answer 3"],
      "explanation": "Explanation based on the document",
      "difficulty": "simple or scenario"
    }}
  ]
}}

Requirements:
- Generate {simple_count} questions with difficulty "simple"
- Generate {scenario_count} questions with difficulty "scenario"
- Each question must have exactly 3 wrong_answers and 1 correct_answer
- Return ONLY the JSON object"""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=8000
        )
        
        response_content = response.choices[0].message.content
        questions_data = json.loads(response_content)
        
        questions = []
        questions_list = questions_data.get("questions", [])
        
        # Ensure we assign correct difficulties
        simple_assigned = 0
        scenario_assigned = 0
        
        for i, q_data in enumerate(questions_list):
            if simple_assigned < simple_count:
                q_data["difficulty"] = "simple"
                simple_assigned += 1
            elif scenario_assigned < scenario_count:
                q_data["difficulty"] = "scenario"
                scenario_assigned += 1
            else:
                break
                
            questions.append(QuizQuestion(**q_data))
        
        return questions
    
    except Exception as e:
        print(f"Error generating chunk questions: {e}")
        return []

async def save_quiz_to_database(
    course_id: str,
    user_email: str,
    quiz_data: QuizGenerationResponse,
    course_file_id: Optional[str] = None
) -> Dict:
    """
    Save generated quiz to database (quiz_topics and quiz_questions tables)
    """
    try:
        supabase = get_supabase_client()
        
        # Get user ID from email
        user_result = supabase.table("users").select("id").eq("email", user_email).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_result.data[0]["id"]
        
        # Insert quiz topic
        topic_data = {
            "course_id": course_id,
            "topic_name": quiz_data.topic_title
        }
        topic_result = supabase.table("quiz_topics").insert(topic_data).execute()
        
        if not topic_result.data:
            raise HTTPException(status_code=500, detail="Failed to create quiz topic")
        
        topic_id = topic_result.data[0]["id"]
        
        # Update quiz count in courses table
        try:
            # Get current quiz count
            course_result = supabase.table("courses").select("quizzes_count").eq("id", course_id).execute()
            if course_result.data:
                current_count = course_result.data[0].get("quizzes_count", 0) or 0
                new_count = current_count + 1
                
                # Update the count
                supabase.table("courses").update({"quizzes_count": new_count}).eq("id", course_id).execute()
        except Exception as e:
            print(f"Warning: Failed to update quiz count: {e}")
            # Don't fail the entire operation if count update fails
        
        # Insert quiz questions
        questions_data = []
        for question in quiz_data.questions:
            randomized = randomize_options(question.correct_answer, question.wrong_answers)
            
            question_data = {
                "course_id": course_id,
                "topic_id": topic_id,
                "created_by": user_id,
                "question_text": question.question_text,
                "option_a": randomized["option_a"],
                "option_b": randomized["option_b"],
                "option_c": randomized["option_c"],
                "option_d": randomized["option_d"],
                "correct_answer": randomized["correct_answer"],
                "explanation": question.explanation
            }
            questions_data.append(question_data)
        
        # Batch insert questions
        questions_result = supabase.table("quiz_questions").insert(questions_data).execute()
        
        if not questions_result.data:
            raise HTTPException(status_code=500, detail="Failed to create quiz questions")
        
        return {
            "success": True,
            "topic_id": topic_id,
            "topic_title": quiz_data.topic_title,
            "questions_created": len(questions_result.data),
            "message": f"Successfully created quiz topic '{quiz_data.topic_title}' with {len(questions_result.data)} questions"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving quiz to database: {str(e)}")

async def generate_quiz_for_file(request: QuizGenerationRequest) -> Dict:
    """
    Main function to generate quiz for a file with comprehensive error handling
    """
    try:
        print(f"Starting quiz generation for file: {request.filename}")
        
        # Validate request
        if not request.filename or not request.content:
            raise HTTPException(status_code=400, detail="Filename and content are required")
        
        if len(request.content.strip()) < 100:
            raise HTTPException(status_code=400, detail="Content too short to generate meaningful quiz")
        
        # Generate quiz using LLM
        quiz_data = await generate_quiz_with_llm(request.filename, request.content)
        
        # Save to database
        result = await save_quiz_to_database(
            course_id=request.course_id,
            user_email=request.user_email,
            quiz_data=quiz_data,
            course_file_id=request.course_file_id
        )
        
        print(f"Successfully completed quiz generation for {request.filename}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error generating quiz for file {request.filename}: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# Helper function to get quizzes for a course
async def get_course_quizzes(course_id: str) -> Dict:
    """
    Retrieve all quiz topics and questions for a course
    """
    try:
        supabase = get_supabase_client()
        
        # Get quiz topics
        topics_result = supabase.table("quiz_topics").select("*").eq("course_id", course_id).execute()
        
        topics_with_questions = []
        for topic in topics_result.data:
            # Get questions for this topic
            questions_result = supabase.table("quiz_questions").select("*").eq("topic_id", topic["id"]).execute()
            
            topic_data = {
                **topic,
                "questions": questions_result.data,
                "question_count": len(questions_result.data)
            }
            topics_with_questions.append(topic_data)
        
        return {
            "success": True,
            "course_id": course_id,
            "topics": topics_with_questions,
            "total_topics": len(topics_with_questions),
            "total_questions": sum(topic["question_count"] for topic in topics_with_questions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving course quizzes: {str(e)}")
