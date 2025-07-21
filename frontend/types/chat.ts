export interface Chat {
  id: string;
  title: string;
  module: string;
  createdAt: Date;
  messages?: Message[];
}

export interface Module {
  code: string;
  name: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  thinkingTime?: number;
  isThinking?: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  year: string;
  studentsCount: number;
  filesCount: number;
  quizzesCount: number;
  createdDate: string;
  lastModified: string;
}
