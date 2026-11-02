import type { LucideIcon } from "lucide-react";
import {
  Binary,
  Bot,
  Boxes,
  Brain,
  Braces,
  Cloud,
  Coffee,
  Cpu,
  Database,
  Globe,
  Layers,
  Monitor,
  Network,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

export type DomainMeta = {
  icon: LucideIcon;
  description: string;
  iconClass: string;
};

export const DOMAIN_META: Record<string, DomainMeta> = {
  "Data Structures and Algorithms": {
    icon: Binary,
    description: "Arrays, trees, graphs, complexity, and problem solving.",
    iconClass: "bg-[#eaf2ff] text-[#3978e8]",
  },
  Python: {
    icon: Terminal,
    description: "Core language, concurrency, tooling, and production patterns.",
    iconClass: "bg-[#e9f7f2] text-[#16856b]",
  },
  Java: {
    icon: Coffee,
    description: "JVM, collections, concurrency, and enterprise Java.",
    iconClass: "bg-[#fff5e5] text-[#a66b17]",
  },
  "C++": {
    icon: Braces,
    description: "Memory, ownership, templates, and modern C++.",
    iconClass: "bg-[#f0edff] text-[#7962cf]",
  },
  "Object-Oriented Programming": {
    icon: Boxes,
    description: "Abstraction, SOLID, composition, and design patterns.",
    iconClass: "bg-[#e8f6fb] text-[#0e7490]",
  },
  "Database Management": {
    icon: Database,
    description: "SQL, transactions, indexing, and data modelling.",
    iconClass: "bg-[#fdf2f8] text-[#be185d]",
  },
  "Operating Systems": {
    icon: Monitor,
    description: "Processes, memory, scheduling, and file systems.",
    iconClass: "bg-[#f1f5fb] text-[#475569]",
  },
  "Computer Networks": {
    icon: Network,
    description: "Protocols, DNS, HTTP, routing, and network security.",
    iconClass: "bg-[#eff6ff] text-[#1d4ed8]",
  },
  "System Design": {
    icon: Layers,
    description: "Scalability, consistency, queues, and architecture trade-offs.",
    iconClass: "bg-[#f5f3ff] text-[#6d28d9]",
  },
  "Machine Learning": {
    icon: Brain,
    description: "Models, evaluation, features, and production ML.",
    iconClass: "bg-[#ecfdf5] text-[#047857]",
  },
  "Deep Learning": {
    icon: Cpu,
    description: "Neural networks, training, transformers, and optimization.",
    iconClass: "bg-[#fff7ed] text-[#c2410c]",
  },
  "Generative AI": {
    icon: Sparkles,
    description: "LLMs, RAG, embeddings, evaluation, and guardrails.",
    iconClass: "bg-[#fdf4ff] text-[#a21caf]",
  },
  "Agentic AI": {
    icon: Bot,
    description: "Planning, tools, memory, orchestration, and agent safety.",
    iconClass: "bg-[#eef2ff] text-[#4338ca]",
  },
  Cybersecurity: {
    icon: ShieldCheck,
    description: "Web security, cryptography, threats, and defence.",
    iconClass: "bg-[#fef2f2] text-[#b91c1c]",
  },
  "Cloud Computing": {
    icon: Cloud,
    description: "AWS fundamentals, containers, scaling, and reliability.",
    iconClass: "bg-[#ecfeff] text-[#0e7490]",
  },
  "Web Development": {
    icon: Globe,
    description: "HTTP, React, rendering, APIs, and web security.",
    iconClass: "bg-[#f0fdf4] text-[#15803d]",
  },
};

export function getDomainMeta(name: string): DomainMeta {
  return (
    DOMAIN_META[name] || {
      icon: Layers,
      description: "Computer science practice questions.",
      iconClass: "bg-[#eaf2ff] text-[#3978e8]",
    }
  );
}
