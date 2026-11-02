"""Generic role profiles for skill-fit assessment.

Roles describe the skills that matter for a role. They are intentionally
company-agnostic: no job description is required.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Requirement:
    label: str
    weight: int
    aliases: tuple[str, ...]


@dataclass(frozen=True)
class Role:
    name: str
    description: str
    requirements: tuple[Requirement, ...]


def _req(label: str, weight: int, aliases: list[str]) -> Requirement:
    return Requirement(label=label, weight=weight, aliases=tuple(aliases))


ROLES: list[Role] = [
    Role(
        "Software Engineer",
        "Designs, builds, and maintains reliable software systems.",
        (
            _req("Programming", 25, ["python", "java", "c++", "c#", "go", "javascript", "typescript"]),
            _req("Data Structures & Algorithms", 20, ["data structures", "algorithms", "dsa", "data structures and algorithms"]),
            _req("System Design", 15, ["system design", "architecture", "microservices", "distributed systems"]),
            _req("Databases", 15, ["sql", "postgresql", "mysql", "mongodb", "database", "databases", "nosql"]),
            _req("Operating Systems", 10, ["operating systems", "linux", "os"]),
            _req("Networking", 10, ["computer networks", "networking", "tcp", "http", "dns"]),
            _req("Communication", 5, ["communication", "public speaking", "leadership"]),
        ),
    ),
    Role(
        "AI Engineer",
        "Builds AI products using machine learning, LLMs, and production tooling.",
        (
            _req("Programming", 20, ["python", "java", "c++", "javascript", "typescript"]),
            _req("Machine Learning", 20, ["machine learning", "ml", "scikit-learn"]),
            _req("Deep Learning", 15, ["deep learning", "neural networks", "tensorflow", "pytorch", "keras"]),
            _req("Generative AI", 15, ["generative ai", "genai", "llm", "large language models", "rag"]),
            _req("Data & SQL", 10, ["sql", "pandas", "numpy", "data analysis"]),
            _req("MLOps & Cloud", 10, ["docker", "kubernetes", "aws", "mlflow"]),
            _req("Communication", 10, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Machine Learning Engineer",
        "Turns models into reliable, scalable production systems.",
        (
            _req("Programming", 20, ["python", "java", "c++"]),
            _req("Machine Learning", 20, ["machine learning", "ml", "scikit-learn"]),
            _req("Deep Learning", 15, ["deep learning", "neural networks", "tensorflow", "pytorch"]),
            _req("Data Engineering", 15, ["data pipelines", "etl", "spark", "airflow", "kafka", "sql"]),
            _req("MLOps", 15, ["docker", "kubernetes", "mlflow", "aws"]),
            _req("System Design", 10, ["system design", "architecture", "distributed systems"]),
            _req("Communication", 5, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Data Scientist",
        "Turns data into models, experiments, and business insight.",
        (
            _req("Python", 20, ["python", "pandas", "numpy"]),
            _req("Machine Learning", 20, ["machine learning", "ml", "scikit-learn"]),
            _req("Statistics", 15, ["statistics", "probability"]),
            _req("SQL", 15, ["sql", "postgresql", "mysql"]),
            _req("Data Analysis", 15, ["data analysis", "data science", "pandas"]),
            _req("Visualization", 10, ["data visualization", "tableau", "power bi", "matplotlib", "seaborn"]),
            _req("Communication", 5, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Frontend Engineer",
        "Builds accessible, fast, and polished web experiences.",
        (
            _req("JavaScript", 20, ["javascript", "typescript", "js", "ts"]),
            _req("React", 20, ["react", "next.js", "nextjs", "vue", "angular"]),
            _req("HTML & CSS", 15, ["html", "css"]),
            _req("Web APIs", 10, ["rest api", "graphql", "http", "api"]),
            _req("Git", 5, ["git", "github", "gitlab"]),
            _req("UI/UX", 10, ["ui/ux", "figma", "user experience", "design"]),
            _req("Testing", 10, ["testing", "unit testing", "jest", "cypress", "playwright"]),
            _req("Communication", 10, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Backend Engineer",
        "Builds APIs, data flows, and services that scale safely.",
        (
            _req("Programming", 20, ["python", "java", "node", "go", "c#", "ruby", "php"]),
            _req("API Design", 15, ["rest api", "graphql", "api", "fastapi", "django", "flask", "spring"]),
            _req("Databases", 15, ["sql", "postgresql", "mysql", "mongodb", "database", "nosql"]),
            _req("System Design", 15, ["system design", "architecture", "microservices", "distributed systems"]),
            _req("Caching", 10, ["redis", "caching", "memcached"]),
            _req("Cloud & DevOps", 10, ["aws", "docker", "kubernetes", "ci/cd"]),
            _req("Security", 5, ["security", "owasp", "authentication", "authorization"]),
            _req("Communication", 10, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Full Stack Engineer",
        "Owns features across the browser, API, and database.",
        (
            _req("Frontend", 20, ["react", "javascript", "typescript", "html", "css"]),
            _req("Backend", 20, ["node", "python", "java", "rest api", "fastapi", "django"]),
            _req("Databases", 15, ["sql", "postgresql", "mysql", "mongodb", "database"]),
            _req("API Design", 15, ["rest api", "graphql", "api"]),
            _req("DevOps", 10, ["docker", "kubernetes", "ci/cd", "aws"]),
            _req("System Design", 10, ["system design", "architecture"]),
            _req("Communication", 10, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "DevOps Engineer",
        "Automates delivery, infrastructure, and reliable operations.",
        (
            _req("Linux", 15, ["linux", "bash", "shell"]),
            _req("Containers", 15, ["docker", "containers"]),
            _req("Kubernetes", 15, ["kubernetes", "k8s"]),
            _req("CI/CD", 15, ["ci/cd", "cicd", "continuous integration", "jenkins", "github actions"]),
            _req("Cloud", 15, ["aws", "azure", "gcp", "cloud"]),
            _req("Infrastructure as Code", 10, ["terraform", "cloudformation", "ansible"]),
            _req("Scripting", 10, ["python", "bash", "go"]),
            _req("Communication", 5, ["communication"]),
        ),
    ),
    Role(
        "Cybersecurity Analyst",
        "Protects systems, investigates threats, and reduces risk.",
        (
            _req("Networking", 15, ["computer networks", "networking", "tcp", "http", "dns"]),
            _req("Security", 20, ["cybersecurity", "security", "owasp", "penetration testing"]),
            _req("Linux", 10, ["linux", "bash"]),
            _req("Scripting", 15, ["python", "bash", "powershell"]),
            _req("Cryptography", 10, ["cryptography", "encryption", "tls"]),
            _req("Incident Response", 10, ["incident response", "siem", "forensics"]),
            _req("Cloud Security", 10, ["cloud security", "aws security", "iam"]),
            _req("Communication", 10, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Cloud Engineer",
        "Designs and operates secure, scalable cloud platforms.",
        (
            _req("Cloud", 20, ["aws", "azure", "gcp", "cloud"]),
            _req("Linux", 10, ["linux", "bash"]),
            _req("Containers", 15, ["docker", "containers"]),
            _req("Kubernetes", 10, ["kubernetes", "k8s"]),
            _req("Networking", 10, ["networking", "vpc", "dns", "tcp"]),
            _req("Infrastructure as Code", 10, ["terraform", "cloudformation"]),
            _req("Security", 10, ["security", "iam", "encryption"]),
            _req("Communication", 15, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Data Engineer",
        "Builds reliable pipelines and data platforms.",
        (
            _req("Python", 15, ["python", "pandas"]),
            _req("SQL", 20, ["sql", "postgresql", "mysql"]),
            _req("Data Pipelines", 20, ["data pipelines", "etl", "airflow", "spark", "kafka"]),
            _req("Cloud", 15, ["aws", "azure", "gcp", "cloud"]),
            _req("Docker", 10, ["docker", "containers"]),
            _req("Streaming", 10, ["kafka", "streaming", "event streaming"]),
            _req("Communication", 10, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Python Developer",
        "Builds Python services, APIs, and automation.",
        (
            _req("Python", 30, ["python"]),
            _req("SQL", 15, ["sql", "postgresql", "mysql"]),
            _req("APIs", 15, ["rest api", "fastapi", "django", "flask", "api"]),
            _req("Testing", 10, ["testing", "pytest", "unit testing"]),
            _req("Git", 10, ["git", "github", "gitlab"]),
            _req("Async", 5, ["asyncio", "async", "concurrency"]),
            _req("Communication", 15, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Java Developer",
        "Builds robust Java applications and enterprise services.",
        (
            _req("Java", 30, ["java"]),
            _req("Spring", 15, ["spring", "spring boot"]),
            _req("SQL", 15, ["sql", "postgresql", "mysql"]),
            _req("APIs", 10, ["rest api", "spring", "api"]),
            _req("Testing", 10, ["testing", "junit", "unit testing"]),
            _req("Git", 5, ["git", "github", "gitlab"]),
            _req("Communication", 15, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "QA Engineer",
        "Finds risk early and builds confidence in software quality.",
        (
            _req("Testing", 30, ["testing", "manual testing", "unit testing"]),
            _req("Automation", 20, ["selenium", "cypress", "playwright", "automation"]),
            _req("Programming", 15, ["python", "java", "javascript"]),
            _req("SQL", 10, ["sql", "postgresql", "mysql"]),
            _req("CI/CD", 10, ["ci/cd", "jenkins", "github actions"]),
            _req("Communication", 15, ["communication", "public speaking"]),
        ),
    ),
    Role(
        "Mobile Developer",
        "Builds polished mobile experiences across platforms.",
        (
            _req("Swift/Kotlin", 25, ["swift", "kotlin"]),
            _req("Mobile Frameworks", 20, ["react native", "flutter", "mobile development"]),
            _req("APIs", 15, ["rest api", "api", "graphql"]),
            _req("UI/UX", 10, ["ui/ux", "figma", "user experience"]),
            _req("Git", 10, ["git", "github"]),
            _req("Testing", 10, ["testing", "unit testing"]),
            _req("Communication", 10, ["communication"]),
        ),
    ),
]


EXCLUDED_SKILLS = {"communication", "communications"}

REQUIREMENT_TOPICS: dict[str, list[str]] = {
    "Programming": [
        "Language collections and memory model",
        "Complexity analysis and optimization",
        "Concurrency and error handling",
        "Testing and debugging",
    ],
    "Data Structures & Algorithms": [
        "Arrays, strings, and hash maps",
        "Trees, graphs, BFS and DFS",
        "Sorting, searching, and two pointers",
        "Dynamic programming patterns",
    ],
    "System Design": [
        "Caching, CDNs, and load balancing",
        "Database replication and sharding",
        "Queues and asynchronous processing",
        "Rate limiting and idempotency",
    ],
    "Databases": [
        "Indexes and query plans",
        "Transactions and isolation levels",
        "Normalization vs denormalization",
        "N+1 queries and connection pooling",
    ],
    "Operating Systems": [
        "Processes, threads, and scheduling",
        "Virtual memory and paging",
        "Deadlocks and synchronization",
        "File systems and I/O",
    ],
    "Networking": [
        "TCP vs UDP and congestion control",
        "DNS, HTTP, and TLS",
        "Subnets, routing, and NAT",
        "Load balancers and CDNs",
    ],
    "Machine Learning": [
        "Bias-variance and validation",
        "Feature engineering and data leakage",
        "Precision, recall, and ROC-AUC",
        "Model deployment and monitoring",
    ],
    "Deep Learning": [
        "Backpropagation and optimization",
        "CNNs, RNNs, and transformers",
        "Regularization and normalization",
        "Transfer learning and fine-tuning",
    ],
    "Generative AI": [
        "Prompting and evaluation",
        "RAG, embeddings, and vector search",
        "Fine-tuning vs prompting",
        "Hallucination and guardrails",
    ],
    "Data & SQL": [
        "SQL joins and window functions",
        "Pandas data cleaning",
        "Feature aggregation",
        "Query performance",
    ],
    "MLOps & Cloud": [
        "Docker and model packaging",
        "CI/CD for ML",
        "Model monitoring and drift",
        "Cloud storage and compute",
    ],
    "Data Engineering": [
        "ETL and data modeling",
        "Airflow or workflow orchestration",
        "Spark and distributed processing",
        "Kafka and streaming",
    ],
    "MLOps": [
        "Experiment tracking",
        "Model packaging and serving",
        "Monitoring and drift detection",
        "CI/CD for ML",
    ],
    "Statistics": [
        "Hypothesis testing",
        "Confidence intervals",
        "A/B testing",
        "Probability distributions",
    ],
    "Data Analysis": [
        "Exploratory data analysis",
        "Cohort and funnel analysis",
        "SQL aggregations",
        "Data quality checks",
    ],
    "Visualization": [
        "Chart selection",
        "Tableau or Power BI dashboards",
        "Matplotlib and Seaborn",
        "Storytelling with data",
    ],
    "JavaScript": [
        "Closures and prototypes",
        "Event loop and async programming",
        "ES modules and tooling",
        "Error handling",
    ],
    "React": [
        "Component state and props",
        "Hooks and effects",
        "Rendering and reconciliation",
        "Performance profiling",
    ],
    "HTML & CSS": [
        "Semantic HTML",
        "Flexbox and grid",
        "Responsive design",
        "Accessibility",
    ],
    "Web APIs": [
        "REST resource design",
        "GraphQL queries and schemas",
        "Authentication headers",
        "Error and status codes",
    ],
    "Git": [
        "Branching and merging",
        "Rebasing",
        "Conflict resolution",
        "Pull request workflow",
    ],
    "UI/UX": [
        "Information hierarchy",
        "Figma handoff",
        "Accessibility and contrast",
        "Usability testing",
    ],
    "Testing": [
        "Unit and integration tests",
        "Test doubles and mocking",
        "Edge cases and fixtures",
        "Coverage and flaky tests",
    ],
    "API Design": [
        "REST resources and verbs",
        "Pagination and filtering",
        "Versioning and error contracts",
        "Idempotency and rate limits",
    ],
    "Caching": [
        "Cache-aside and write-through",
        "TTL and invalidation",
        "Redis data structures",
        "Cache stampedes",
    ],
    "Cloud & DevOps": [
        "Containers and registries",
        "CI/CD pipelines",
        "Cloud networking",
        "Observability and rollbacks",
    ],
    "Security": [
        "Authentication vs authorization",
        "OWASP Top 10",
        "Secrets management",
        "Input validation and encryption",
    ],
    "Frontend": [
        "Component architecture",
        "State management",
        "Accessibility",
        "Web performance",
    ],
    "Backend": [
        "API and service boundaries",
        "Database access patterns",
        "Background jobs",
        "Observability",
    ],
    "DevOps": [
        "Docker and Kubernetes",
        "CI/CD pipelines",
        "Infrastructure as code",
        "Monitoring and incident response",
    ],
    "Linux": [
        "Processes and signals",
        "File permissions",
        "Networking commands",
        "Systemd and logs",
    ],
    "Containers": [
        "Images and layers",
        "Volumes and networking",
        "Resource limits",
        "Container security",
    ],
    "Kubernetes": [
        "Pods, deployments, and services",
        "ConfigMaps and secrets",
        "Ingress and networking",
        "Scaling and probes",
    ],
    "CI/CD": [
        "Pipeline stages",
        "Build caching",
        "Deployment strategies",
        "Rollbacks and approvals",
    ],
    "Cloud": [
        "VPC and networking",
        "Auto-scaling and load balancing",
        "Object storage and IAM",
        "Cost and reliability",
    ],
    "Infrastructure as Code": [
        "Terraform state and modules",
        "Plan and apply workflow",
        "Drift detection",
        "Secrets in IaC",
    ],
    "Scripting": [
        "File and process automation",
        "Error handling",
        "HTTP and JSON",
        "Scheduling and logs",
    ],
    "Cryptography": [
        "Symmetric vs asymmetric encryption",
        "TLS handshake",
        "Hashing and salting",
        "Key management",
    ],
    "Incident Response": [
        "Detection and triage",
        "Containment and eradication",
        "Forensics and evidence",
        "Post-incident review",
    ],
    "Cloud Security": [
        "IAM least privilege",
        "Network segmentation",
        "Encryption at rest and in transit",
        "Cloud audit logs",
    ],
    "Data Pipelines": [
        "Batch vs streaming",
        "Idempotent jobs",
        "Orchestration and retries",
        "Data quality checks",
    ],
    "Streaming": [
        "Kafka topics and partitions",
        "Consumer groups",
        "Exactly-once semantics",
        "Backpressure",
    ],
    "Python": [
        "Data structures and comprehensions",
        "Generators and iterators",
        "Exceptions and context managers",
        "Testing and packaging",
    ],
    "SQL": [
        "Joins and subqueries",
        "Window functions",
        "Indexes and query plans",
        "Transactions",
    ],
    "APIs": [
        "REST resource design",
        "Serialization and validation",
        "Auth and error handling",
        "Pagination and rate limits",
    ],
    "Async": [
        "Event loop and coroutines",
        "Tasks and cancellation",
        "Blocking calls",
        "Concurrency limits",
    ],
    "Java": [
        "Collections and generics",
        "JVM memory and GC",
        "Concurrency",
        "Testing and build tools",
    ],
    "Spring": [
        "Dependency injection",
        "REST controllers",
        "Data access",
        "Security and configuration",
    ],
    "Automation": [
        "Test design patterns",
        "Selenium or Playwright",
        "Fixtures and reporting",
        "CI integration",
    ],
    "Swift/Kotlin": [
        "Language fundamentals",
        "Memory and lifecycle",
        "Async programming",
        "Testing",
    ],
    "Mobile Frameworks": [
        "Navigation and state",
        "Native modules",
        "Offline storage",
        "Performance profiling",
    ],
}


def topics_for_requirement(label: str) -> list[str]:
    return REQUIREMENT_TOPICS.get(
        label,
        [
            f"{label} fundamentals",
            f"Common interview questions on {label}",
            f"Hands-on {label} exercise",
        ],
    )


def is_excluded_skill(name: str) -> bool:
    return name.strip().lower() in EXCLUDED_SKILLS


def _without_communication(role: Role) -> Role:
    """Communication is assessed by interviews, not self-rated skills."""
    requirements = [
        requirement
        for requirement in role.requirements
        if requirement.label.strip().lower() != "communication"
    ]
    total = sum(requirement.weight for requirement in requirements)
    scaled = []
    remaining = 100
    for index, requirement in enumerate(requirements):
        if index == len(requirements) - 1:
            weight = remaining
        else:
            weight = round(requirement.weight * 100 / total)
            remaining -= weight
        scaled.append(
            Requirement(
                label=requirement.label,
                weight=weight,
                aliases=requirement.aliases,
            )
        )
    return Role(role.name, role.description, tuple(scaled))


ROLES = [_without_communication(role) for role in ROLES]


def _validate() -> None:
    for role in ROLES:
        total = sum(requirement.weight for requirement in role.requirements)
        if total != 100:
            raise ValueError(f"{role.name} weights sum to {total}, expected 100")


_validate()


def get_role(name: str) -> Role | None:
    target = name.strip().lower()
    return next((role for role in ROLES if role.name.lower() == target), None)


def normalize_skill(value: str) -> str:
    text = value.strip().lower()
    replacements = {
        "c++": "cpp",
        "c#": "csharp",
        "ci/cd": "cicd",
        "node.js": "node",
        "next.js": "nextjs",
        "&": "and",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    text = re.sub(r"[^a-z0-9+# ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _best_match(skills: list[Any], aliases: tuple[str, ...]) -> Any | None:
    normalized_aliases = {normalize_skill(alias) for alias in aliases}
    matches = [
        skill
        for skill in skills
        if normalize_skill(skill.name) in normalized_aliases
    ]
    if not matches:
        return None
    return max(matches, key=lambda skill: skill.level)


def assess_role(role: Role, skills: list[Any]) -> dict:
    total_weight = sum(requirement.weight for requirement in role.requirements)
    earned = 0.0
    matched_count = 0
    rows = []
    missing: list[str] = []
    recommendations: list[str] = []

    for requirement in role.requirements:
        skill = _best_match(skills, requirement.aliases)
        if skill:
            matched_count += 1
            earned += requirement.weight * (skill.level / 100)
            rows.append(
                {
                    "requirement": requirement.label,
                    "weight": requirement.weight,
                    "matched_skill": skill.name,
                    "rating": skill.level,
                    "rated": bool(skill.self_rated),
                }
            )
            if skill.level < 60:
                recommendations.append(
                    f"Strengthen {requirement.label}; your self-rating is {skill.level}/100."
                )
        else:
            missing.append(requirement.label)
            rows.append(
                {
                    "requirement": requirement.label,
                    "weight": requirement.weight,
                    "matched_skill": None,
                    "rating": None,
                    "rated": False,
                }
            )
            recommendations.append(
                f"Add evidence for {requirement.label} - it carries {requirement.weight}% of this role."
            )

    score = round(max(0.0, min(100.0, earned)), 1)
    coverage = round((matched_count / len(role.requirements)) * 100, 1) if role.requirements else 0.0
    if score >= 80:
        readiness = "Strong fit"
    elif score >= 65:
        readiness = "Good fit"
    elif score >= 45:
        readiness = "Developing"
    else:
        readiness = "Needs work"

    if not recommendations:
        recommendations.append(
            "Your profile covers the core role requirements. Keep practising with mock interviews."
        )

    return {
        "role": role.name,
        "description": role.description,
        "score": score,
        "coverage": coverage,
        "matched_count": matched_count,
        "required_count": len(role.requirements),
        "readiness": readiness,
        "skills": rows,
        "missing_skills": missing,
        "recommendations": recommendations[:5],
    }
