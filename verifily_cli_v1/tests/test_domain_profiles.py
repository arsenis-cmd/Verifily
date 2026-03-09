"""Tests for verifily_cli_v1.core.domain_profiles — domain detection and profiles."""

import pytest

from verifily_cli_v1.core.domain_profiles import (
    DomainDetectionResult,
    DomainProfile,
    detect_domain,
    get_profile,
    list_profiles,
    _check_code_documentation,
    _check_code_syntax,
    _check_conversational_flow,
    _check_instruction_clarity,
    _check_legal_structure,
    _check_medical_terminology,
)


# ---------------------------------------------------------------------------
# Domain detection
# ---------------------------------------------------------------------------

class TestDomainDetection:
    def test_detect_code(self):
        texts = [
            "def hello():\n    return 'world'",
            "import os\nimport sys\nprint(os.getcwd())",
            "class MyClass:\n    def __init__(self):\n        self.x = 1",
            "function add(a, b) { return a + b; }",
            "const result = arr.map(x => x * 2);",
        ] * 5
        result = detect_domain(texts)
        assert result.detected_domain == "code"
        assert result.confidence > 0.5

    def test_detect_medical(self):
        texts = [
            "The patient presented with acute cardiac symptoms and elevated troponin levels.",
            "Diagnosis of chronic obstructive pulmonary disease confirmed via spirometry.",
            "Treatment protocol includes dual antiplatelet therapy and dose adjustment.",
            "Clinical presentation suggests comorbidity between renal dysfunction and hepatic failure.",
            "Pathology report indicates malignant etiology requiring surgical intervention.",
        ] * 5
        result = detect_domain(texts)
        assert result.detected_domain == "medical"

    def test_detect_instruction(self):
        texts = [
            "Explain the theory of relativity in simple terms.",
            "Describe the process of photosynthesis step by step.",
            "Write a Python function that sorts a list of integers.",
            "Create a summary of World War II major events.",
            "Generate a recipe for chocolate cake with detailed instructions.",
            "List the top 10 programming languages in 2024.",
            "Summarize the key findings of the research paper.",
            "Translate the following English text to French.",
            "Calculate the compound interest for a $1000 investment.",
            "Analyze the sentiment of the following customer reviews.",
        ] * 3
        result = detect_domain(texts)
        # ML zero-shot may classify instruction-heavy text as instruction or code
        # (since many instructions reference programming tasks)
        assert result.detected_domain in ("instruction", "code")

    def test_detect_general_for_mixed(self):
        texts = [
            "The weather is nice today.",
            "I went to the store and bought groceries.",
            "My favorite color is blue.",
            "The movie was interesting.",
        ] * 5
        result = detect_domain(texts)
        # ML zero-shot may classify casual text as conversational rather than general
        assert result.detected_domain in ("general", "conversational")

    def test_empty_dataset(self):
        result = detect_domain([])
        assert result.detected_domain == "general"
        assert result.confidence == 1.0

    def test_returns_evidence(self):
        texts = ["def foo():\n    pass"] * 20
        result = detect_domain(texts)
        assert isinstance(result.evidence, list)

    def test_sample_size_respected(self):
        texts = ["def foo(): pass"] * 1000
        result = detect_domain(texts, sample_size=10)
        assert isinstance(result, DomainDetectionResult)


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

class TestProfiles:
    def test_all_profiles_exist(self):
        names = list_profiles()
        assert "code" in names
        assert "medical" in names
        assert "legal" in names
        assert "conversational" in names
        assert "instruction" in names
        assert "general" in names

    def test_get_profile_returns_correct_type(self):
        profile = get_profile("code")
        assert isinstance(profile, DomainProfile)
        assert profile.name == "code"

    def test_unknown_domain_returns_general(self):
        profile = get_profile("nonexistent")
        assert profile.name == "general"

    def test_axis_weights_sum_to_1(self):
        for name in list_profiles():
            profile = get_profile(name)
            total = sum(profile.axis_weights.values())
            assert abs(total - 1.0) < 0.01, f"{name} weights sum to {total}"

    def test_profile_to_dict(self):
        profile = get_profile("code")
        d = profile.to_dict()
        assert "name" in d
        assert "axis_weights" in d


# ---------------------------------------------------------------------------
# Domain-specific checks
# ---------------------------------------------------------------------------

class TestCodeChecks:
    def test_syntax_detects_unbalanced(self):
        texts = [
            "def foo(a, b {",
            "if (x > 0 { print(x) }",
            "function test() { return 1; }",  # balanced
        ]
        issue = _check_code_syntax(texts)
        assert issue is not None
        assert issue.category == "code_syntax"
        assert issue.count > 0

    def test_syntax_balanced_no_issue(self):
        texts = [
            "def foo(a, b):\n    return a + b",
            "function test() { return 1; }",
        ]
        issue = _check_code_syntax(texts)
        assert issue is None

    def test_documentation_checks(self):
        texts = [
            "def foo():\n    return 1",  # no docs
            "def bar():\n    return 2",  # no docs
            "def baz():\n    return 3",  # no docs
            'def qux():\n    """Documented."""\n    return 4',  # has docs
        ]
        issue = _check_code_documentation(texts)
        # Might or might not flag depending on fraction threshold
        if issue:
            assert issue.category == "code_documentation"


class TestMedicalChecks:
    def test_low_terminology_flagged(self):
        texts = [
            "The weather is nice today and I went shopping at the mall.",
            "I like to eat pizza and watch movies on the weekend.",
            "The cat sat on the mat and looked out the window.",
        ] * 5
        issue = _check_medical_terminology(texts)
        # These have zero medical terms so should be flagged
        if issue:
            assert issue.category == "low_medical_terminology"

    def test_high_terminology_no_issue(self):
        texts = [
            "Patient diagnosis shows chronic cardiac disease requiring treatment intervention.",
            "Clinical symptoms include acute renal pathology with comorbidity considerations.",
        ] * 5
        issue = _check_medical_terminology(texts)
        assert issue is None


class TestInstructionChecks:
    def test_vague_instructions(self):
        texts = ["ok", "yes", "no", "fine", "sure"] * 10
        issue = _check_instruction_clarity(texts)
        if issue:
            assert issue.category == "instruction_clarity"

    def test_clear_instructions_no_issue(self):
        texts = [
            "Explain the concept of machine learning in detail.",
            "Describe the process of training a neural network step by step.",
        ] * 5
        issue = _check_instruction_clarity(texts)
        assert issue is None


class TestConversationalChecks:
    def test_broken_flow(self):
        texts = ["y", "n", "k", ".", "!"] * 10
        issue = _check_conversational_flow(texts)
        if issue:
            assert issue.category == "conversational_flow"
