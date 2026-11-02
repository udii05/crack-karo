"""Deterministic mock AI provider.

Generates plausible questions, scores, and feedback locally so the
application is fully functional with zero configuration / no API key.
"""

import random

BEHAVIORAL_QUESTIONS = [
    "Tell me about a time you had to work under pressure. What did you do?",
    "Describe a situation where you disagreed with a teammate. How was it resolved?",
    "Tell me about a project you are most proud of and your role in it.",
    "Describe a time you made a mistake at work. What did you learn?",
    "Give an example of when you showed leadership.",
]

TECHNICAL_QUESTIONS = [
    "Explain the difference between SQL and NoSQL databases.",
    "How does an HTTP request work from the browser to the server?",
    "What is the difference between a process and a thread?",
    "How would you design a URL shortener?",
    "Explain RESTful API design principles.",
]

DOMAIN_QUESTIONS = {
    "python": "How does Python's Global Interpreter Lock (GIL) affect concurrency?",
    "javascript": "Explain event delegation and closures in JavaScript.",
    "aws": "Explain how AWS IAM roles differ from users and when you would use each.",
    "sql": "Write a query to find the second highest salary in a table.",
    "react": "What is the difference between useState and useReducer?",
}

HINTS = {
    "behavioral": "Use the STAR method: Situation, Task, Action, Result. Be specific and concise.",
    "technical": "Start with a high-level overview, then dive into details. Use an example to anchor your answer.",
}

FEEDBACK_TEMPLATES = {
    "high": [
        "Great structure! You answered the question directly and gave a concrete example.",
        "Strong answer with clear reasoning and specific detail.",
    ],
    "mid": [
        "Solid attempt. Consider structuring your answer with a clear framework like STAR.",
        "Good content, but a sharper opening would make the answer more impactful.",
    ],
    "low": [
        "The answer is brief and could benefit from a concrete example.",
        "Try to be more specific and tie your answer back to the question asked.",
    ],
}

WEAKNESSES = {
    "behavioral": "Add more measurable outcomes and 'Result' in your stories.",
    "technical": "Include more concrete technical details or a code-level example.",
}


class MockProvider:
    def __init__(self):
        self._question_counter = 0

    def generate_question(self, category: str, difficulty: str, skills: list[str]) -> dict:
        # Include a counter in the seed so each question in an interview is different
        self._question_counter += 1
        rng = random.Random(f"{category}-{difficulty}-{','.join(skills[:2])}-{self._question_counter}")
        pool = DOMAIN_QUESTIONS if category == "domain" else (
            TECHNICAL_QUESTIONS if category == "technical" else BEHAVIORAL_QUESTIONS
        )
        body = rng.choice(pool)
        hint = HINTS.get(category, HINTS["behavioral"])
        return {"body": body, "hint": hint}

    def score_answer(self, question: str, answer: str, category: str) -> dict:
        """
        Score an answer based on content quality, not just length.
        Evaluates: relevance (keyword overlap), structure (STAR/framework), 
        technical depth (domain terms), and delivery (clarity/completeness).
        """
        answer_lower = answer.lower()
        question_lower = question.lower()
        words = answer.split()
        length = len(words)

        # --- Relevance: keyword/concept overlap with question ---
        # Extract key terms from question (nouns, technical terms)
        question_terms = self._extract_key_terms(question_lower)
        answer_terms = self._extract_key_terms(answer_lower)
        overlap = len(question_terms & answer_terms)
        relevance_base = min(100, overlap * 15 + length * 0.8)
        # Penalize very short answers heavily
        if length < 15:
            relevance_base *= 0.4
        elif length < 30:
            relevance_base *= 0.7
        relevance = min(100, max(0, relevance_base + random.randint(-5, 5)))

        # --- Structure: STAR for behavioral, framework for technical ---
        structure_score = self._score_structure(answer_lower, category, length)
        structure = min(100, max(0, structure_score + random.randint(-5, 5)))

        # --- Technical: domain-specific terminology depth ---
        technical_score = self._score_technical(answer_lower, category, question_lower, length)
        technical = min(100, max(0, technical_score + random.randint(-8, 5)))

        # --- Delivery: clarity, completeness, professional tone ---
        delivery_score = self._score_delivery(answer_lower, length)
        delivery = min(100, max(0, delivery_score + random.randint(-5, 5)))

        # Weighted composite
        score = round(0.35 * relevance + 0.25 * structure + 0.25 * technical + 0.15 * delivery, 1)

        # Feedback tier
        if score >= 75:
            feedback_text = random.choice(FEEDBACK_TEMPLATES["high"])
        elif score >= 50:
            feedback_text = random.choice(FEEDBACK_TEMPLATES["mid"])
        else:
            feedback_text = random.choice(FEEDBACK_TEMPLATES["low"])

        # Specific weaknesses based on lowest dimension
        dims = {"relevance": relevance, "structure": structure, "technical": technical, "delivery": delivery}
        weakest = min(dims, key=dims.get)
        weakness_msg = self._weakness_for_dimension(weakest, category)

        return {
            "score": score,
            "summary": feedback_text,
            "dimensions": {
                "relevance": round(relevance, 1),
                "structure": round(structure, 1),
                "technical": round(technical, 1),
                "delivery": round(delivery, 1),
            },
            "weaknesses": [weakness_msg],
        }

    def _extract_key_terms(self, text: str) -> set[str]:
        """Extract meaningful terms (nouns, technical words) from text."""
        # Simple stopword filter + keep technical terms
        stopwords = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "can", "must", "i", "you", "he", "she", "it",
            "we", "they", "this", "that", "these", "those", "my", "your", "his",
            "her", "its", "our", "their", "what", "how", "why", "when", "where",
            "who", "which", "there", "here", "then", "than", "so", "as", "if",
            "because", "while", "during", "before", "after", "about", "into",
            "through", "over", "under", "again", "further", "once", "more", "most",
            "very", "just", "now", "also", "even", "only", "own", "same", "such",
            "no", "not", "nor", "too", "up", "down", "out", "off", "on", "again"
        }
        # Split on non-alphanumeric, keep terms > 2 chars, filter stopwords
        import re
        tokens = re.findall(r"[a-z0-9\+\#\.]+", text.lower())
        return {t for t in tokens if len(t) > 2 and t not in stopwords}

    def _score_structure(self, answer: str, category: str, length: int) -> float:
        """Score answer structure: STAR for behavioral, logical flow for technical."""
        score = 20  # base
        score += min(30, length * 0.5)  # length contributes

        if category == "behavioral":
            # STAR indicators
            star_markers = {
                "situation": ["situation", "context", "background", "when", "faced", "challenge"],
                "task": ["task", "goal", "objective", "responsible", "needed to", "had to"],
                "action": ["action", "did", "implemented", "built", "created", "led", "designed", "developed", "solved"],
                "result": ["result", "outcome", "achieved", "improved", "reduced", "increased", "saved", "delivered", "percent", "%", "metric"],
            }
            for phase, markers in star_markers.items():
                if any(m in answer for m in markers):
                    score += 12
        else:
            # Technical: look for framework indicators
            framework_markers = [
                "first", "then", "next", "finally", "step", "approach", "method",
                "architecture", "design", "component", "layer", "service", "api",
                "database", "cache", "queue", "load balancer", "trade-off", "scalability",
                "consistency", "availability", "partition", "cap theorem", "microservice",
            ]
            hits = sum(1 for m in framework_markers if m in answer)
            score += min(30, hits * 5)

        return score

    def _score_technical(self, answer: str, category: str, question: str, length: int) -> float:
        """Score technical depth based on domain terminology."""
        score = 15  # base
        score += min(25, length * 0.4)

        # Technical terms that indicate depth
        tech_terms = {
            "general": ["algorithm", "complexity", "time", "space", "big o", "o(n)", "o(1)", "optimization",
                       "latency", "throughput", "concurrency", "parallel", "thread", "process", "memory",
                       "cache", "index", "query", "transaction", "acid", "consistency", "availability",
                       "partition", "cap", "paxos", "raft", "leader", "follower", "replication",
                       "load balancer", "reverse proxy", "cdn", "dns", "http", "https", "tls", "ssl",
                       "rest", "graphql", "grpc", "api", "endpoint", "request", "response", "status code",
                       "authentication", "authorization", "oauth", "jwt", "token", "session", "cookie",
                       "docker", "kubernetes", "container", "orchestration", "deployment", "ci/cd",
                       "pipeline", "git", "branch", "merge", "rebase", "conflict", "pull request",
                       "testing", "unit", "integration", "e2e", "mock", "stub", "coverage",
                       "design pattern", "singleton", "factory", "observer", "dependency injection",
                       "solid", "dry", "kiss", "yagni", "clean code", "refactor"],
            "sql": ["select", "join", "inner", "left", "right", "group by", "having", "where",
                   "index", "primary key", "foreign key", "normalize", "denormalize", "transaction",
                   "isolation", "deadlock", "explain plan", "execution plan"],
            "nosql": ["document", "collection", "key-value", "column", "graph", "eventual consistency",
                     "sharding", "replica set", "mongodb", "cassandra", "redis", "dynamodb"],
            "python": ["gil", "global interpreter lock", "threading", "multiprocessing", "asyncio",
                      "await", "async", "coroutine", "event loop", "generator", "decorator",
                      "context manager", "with", "lambda", "list comprehension", "virtualenv",
                      "pip", "poetry", "requirements", "pypi", "dataclass", "typing", "mypy"],
            "javascript": ["event loop", "promise", "async", "await", "closure", "prototype",
                          "this", "bind", "call", "apply", "event delegation", "bubbling",
                          "capturing", "dom", "virtual dom", "react", "vue", "angular", "webpack",
                          "babel", "eslint", "typescript", "interface", "type", "generic"],
            "aws": ["ec2", "s3", "lambda", "dynamodb", "rds", "aurora", "cloudfront", "route53",
                   "iam", "role", "policy", "permission", "vpc", "subnet", "security group",
                   "cloudformation", "terraform", "cloudwatch", "sns", "sqs", "eventbridge"],
        }

        # Determine relevant term sets from question
        relevant_sets = ["general"]
        q = question.lower()
        if "sql" in q or "database" in q or "query" in q:
            relevant_sets.append("sql")
        if "nosql" in q or "mongodb" in q or "redis" in q or "cassandra" in q:
            relevant_sets.append("nosql")
        if "python" in q or "gil" in q:
            relevant_sets.append("python")
        if "javascript" in q or "js" in q or "node" in q or "react" in q:
            relevant_sets.append("javascript")
        if "aws" in q or "cloud" in q or "iam" in q:
            relevant_sets.append("aws")

        all_terms = set()
        for s in relevant_sets:
            all_terms.update(tech_terms.get(s, []))

        hits = sum(1 for term in all_terms if term in answer)
        score += min(40, hits * 6)

        return score

    def _score_delivery(self, answer: str, length: int) -> float:
        """Score delivery: clarity, completeness, professional communication."""
        score = 25  # base
        score += min(30, length * 0.6)

        # Positive indicators
        if length >= 50:
            score += 10
        if length >= 100:
            score += 10

        # Negative indicators
        filler = ["um", "uh", "like", "you know", "basically", "actually", "literally"]
        filler_count = sum(answer.count(f) for f in filler)
        score -= min(15, filler_count * 3)

        # Repetition penalty (simple check)
        words = answer.split()
        if len(words) > 10:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.5:
                score -= 15

        return max(0, score)

    def _weakness_for_dimension(self, dim: str, category: str) -> str:
        weaknesses = {
            "relevance": "Answer didn't address the core concepts in the question. Tie your response directly to what was asked.",
            "structure": "Use a clear framework: STAR for behavioral, or structured design approach for technical questions.",
            "technical": "Include more specific technical terminology, trade-offs, and implementation details.",
            "delivery": "Answer is too brief or repetitive. Aim for a complete, well-paced response with concrete details.",
        }
        return weaknesses.get(dim, "Be more specific and structured.")

    def extract_skills(self, text: str) -> list[str]:
        known = [
            "python", "javascript", "typescript", "react", "node", "sql", "aws",
            "docker", "kubernetes", "java", "c++", "go", "ruby", "php", "git",
            "agile", "scrum", "communication", "leadership", "public speaking",
            "data analysis", "machine learning", "rest api", "graphql", "fastapi",
            "django", "flask", "postgresql", "mongodb", "redis", "ci/cd", "terraform",
            "linux", "bash", "html", "css", "project management", "problem solving",
        ]
        text_lower = text.lower()
        found = [s for s in known if s in text_lower]
        return found

    def analyze_job(self, title: str, description: str) -> dict:
        skills = self.extract_skills(description)
        if not skills:
            skills = ["communication", "problem solving"]
        questions = [
            f"Tell me about your experience with {s}." for s in skills[:4]
        ]
        if "senior" in title.lower() or "lead" in title.lower():
            questions.append("Describe a time you mentored or led a team.")
        if "python" in skills:
            questions.append("Explain Python's GIL and its impact on concurrency.")
        return {"skills": skills, "likely_questions": questions}

    def coach_reply(self, context: str, question: str, history: str = "") -> str:
        question_lower = question.lower()
        if "score" in question_lower or "why" in question_lower:
            return (
                "Your scores are based on four dimensions: relevance, structure, "
                "technical accuracy, and delivery. Open the latest interview report "
                "to see which dimension pulled the overall score down. The quickest "
                "lift usually comes from answering the exact question first, then "
                "supporting it with a concrete example.\n\n"
                f"Performance context:\n{context}"
            )
        if "practice" in question_lower or "next" in question_lower:
            return (
                "Pick the weakest dimension from your dashboard and run one focused "
                "mock interview. Keep the session short, review the report, and repeat "
                "the same question type until the score moves. A 3-question session is "
                "enough for a useful signal.\n\n"
                f"Performance context:\n{context}"
            )
        return (
            "Focus on one improvement at a time. Use STAR for behavioural answers, "
            "lead with the direct answer for technical questions, and close with a "
            "measurable result. After your next session, compare the dimension scores "
            "against this baseline and adjust your practice plan.\n\n"
            f"Performance context:\n{context}"
        )

    def skill_recommendations(self, role: str, context: str) -> dict:
        return {
            "summary": (
                f"Focus your next study block on the highest-weight gaps for {role}. "
                "Work through the topics below, then test them in a mock interview."
            ),
            "focus_areas": [
                {
                    "skill": "Data Structures & Algorithms",
                    "why": "Core problem-solving is assessed in most technical interviews.",
                    "topics": [
                        "Arrays, strings, and hash maps",
                        "Trees and graph traversal",
                        "Dynamic programming patterns",
                    ],
                    "action": "Solve 5 timed problems and write down the trade-offs.",
                },
                {
                    "skill": "System Design",
                    "why": "Explaining architecture and trade-offs is a common interview differentiator.",
                    "topics": [
                        "Caching and load balancing",
                        "Database replication and sharding",
                        "API rate limiting and idempotency",
                    ],
                    "action": "Design one service end to end and present it out loud.",
                },
            ],
            "study_plan": [
                "Review the topics for the two weakest areas.",
                "Practise 5 focused questions in each area.",
                "Run a mock interview and review the feedback.",
            ],
        }

    def copilot_hint(self, context: str, transcript: str) -> dict:
        # Provide STAR framework suggestions
        talking_points = [
            "Open with a one-line summary of your answer.",
            "State the situation and your specific role.",
            "Highlight the action you took and the result.",
        ]
        return {
            "suggestion": "Structure your answer using STAR (Situation, Task, Action, Result). "
                          "Keep it under 2 minutes and end with a measurable outcome.",
            "talking_points": talking_points,
            "star_outline": {
                "Situation": "Set context briefly (1-2 sentences).",
                "Task": "State the goal or challenge you owned.",
                "Action": "Explain the specific steps you took.",
                "Result": "Quantify the outcome if possible.",
            },
        }
