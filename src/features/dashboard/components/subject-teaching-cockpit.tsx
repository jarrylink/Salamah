"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  Edit3,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Info,
  Layers,
  Plus,
  Printer,
  Save,
  Search,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export type SubjectTeachingProps = {
  subject: {
    id: string;
    name: string;
    code: string;
    classId: string;
    className: string;
    students: { id: string; admissionNumber: string; name: string }[];
    scores?: { studentId: string; score: number; typeCode: string; typeName: string }[];
    schemeWeeks?: any[];
    lessonNotes?: any[];
    lessonPlans?: any[];
  };
  assignedTeacher?: { id: string; name: string; staffNumber?: string | null } | null;
  teachers?: { id: string; name: string; staff_number: string | null; email?: string }[];
  availableClasses?: { id: string; name: string; code: string; studentCount?: number }[];
  currentSession?: { id: string; name: string };
  currentTerm?: { id: string; name: string };
  initialTab?: "scheme" | "notes" | "plans" | "scores";
  onSelectClass?: (classId: string) => void;
  onBack?: () => void;
  isSuperAdmin?: boolean;
};

export function SubjectTeachingCockpit({
  subject,
  assignedTeacher,
  teachers = [],
  availableClasses,
  currentSession,
  currentTerm,
  initialTab = "scheme",
  onSelectClass,
  onBack,
  isSuperAdmin = false,
}: SubjectTeachingProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"scheme" | "notes" | "plans" | "scores">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Teacher Assignment Modal state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(assignedTeacher?.id || teachers[0]?.id || "");
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTeacher(true);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-subject-teacher",
          subjectId: subject.id,
          teacherId: selectedTeacherId,
          classId: subject.classId || undefined,
          sessionId: currentSession?.id || undefined,
          termId: currentTerm?.id || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to assign teacher");
      }
      setIsTeacherModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error assigning teacher");
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleUnassignTeacher = async () => {
    if (!confirm("Are you sure you want to unassign the teacher from this subject?")) return;
    setIsSavingTeacher(true);
    try {
      const res = await fetch("/api/subjects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unassign-subject-teacher",
          subjectId: subject.id,
          classId: subject.classId || undefined,
          teacherId: assignedTeacher?.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to unassign teacher");
      }
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error unassigning teacher");
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard");
    }
  };

  const navigateToClass = (classId: string) => {
    if (onSelectClass) {
      onSelectClass(classId);
    } else {
      const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      sp.set("classId", classId);
      router.push(`/dashboard/subjects/${subject.id}?${sp.toString()}`);
    }
  };

  // ==========================================
  // 1. SCHEME OF WORK STATE (WEEKS 1 - 12)
  // ==========================================
  const defaultScheme = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const weekNum = i + 1;
      let topic = `Week ${weekNum} Core Syllabus Topic`;
      let subtopics = "Fundamental concepts, definitions, and practical demonstrations.";
      let objectives = "Students should be able to define core terms, explain principles, and solve illustrative exercises.";
      let activities = "Teacher explanation, classroom interactive discussion, blackboard illustrations, pupil notebook exercises.";
      let resources = "Standard Curriculum Textbook, Illustrated Chart, Whiteboard markers, Exercise handouts.";

      if (subject.name.toLowerCase().includes("english")) {
        const engTopics = [
          { t: "Parts of Speech: Advanced Noun Classifications & Concrete Nouns", st: "Proper, common, collective, abstract, countable and uncountable nouns.", ob: "Identify noun categories in complex sentences and compose descriptive paragraphs." },
          { t: "Reading Comprehension: Narrative Structure & Vocabulary in Context", st: "Skimming, scanning, thematic interpretation, context clues for unfamiliar terms.", ob: "Extract central themes, outline supporting details, and interpret writer's tone." },
          { t: "Verbs: Transitive, Intransitive & Auxiliary Verb Forms", st: "Action verbs, linking verbs, modal auxiliaries (can, could, may, might, must).", ob: "Differentiate verb types and construct grammatically sound modal expressions." },
          { t: "Continuous Writing: Descriptive Composition & Sensory Detail", st: "Sensory imagery, spatial organization, opening hooks, coherent paragraphs.", ob: "Write a 300-word descriptive essay depicting a Nigerian traditional festival or marketplace." },
          { t: "Pronouns: Relative, Reflexive, Demonstrative & Indefinite", st: "Pronoun-antecedent agreement, subject and object cases, common pitfalls.", ob: "Apply correct relative pronoun choices in complex relative clauses." },
          { t: "Mid-Term Continuous Assessment Review & Speech Work (Consonants)", st: "Phonetics: Voiced vs. voiceless consonants /θ/ and /ð/, minimal pairs.", ob: "Articulate target consonant sounds accurately and demonstrate mastery on CA 1 test." },
          { t: "Tenses: Present Perfect & Past Perfect Aspects", st: "Has/have/had + past participle, time markers (since, for, already, yet).", ob: "Accurately apply perfect tense structures in conversational and academic contexts." },
          { t: "Formal Letter Writing: Structure, Tone & Institutional Addressing", st: "Salutations, formal register, concise statement of purpose, complimentary close.", ob: "Draft an official letter of complaint or inquiry to an administrative officer." },
          { t: "Adjectives & Adjectival Clauses: Order of Adjectives", st: "Opinion, size, age, shape, color, origin, material, purpose.", ob: "Correctly sequence multiple adjectives and expand noun phrases using adjectival clauses." },
          { t: "Figures of Speech & Poetry Analysis: Simile, Metaphor & Personification", st: "Poetic devices, stanzaic structure, imagery, rhyme scheme in selected African poems.", ob: "Identify figures of speech and evaluate their stylistic impact on poetic meaning." },
          { t: "Summary Writing & Paraphrasing Techniques", st: "Distinguishing primary arguments from auxiliary illustrations, condensation rules.", ob: "Condense a 400-word informative passage into an 80-word coherent summary paragraph." },
          { t: "Revision, Mock Evaluation & Terminal Examination Preparations", st: "Comprehensive review across all 11 weeks modules, sample exam questions.", ob: "Synthesize all curriculum skills and complete mock exam with high proficiency." },
        ];
        const item = engTopics[i] || engTopics[0];
        topic = item.t;
        subtopics = item.st;
        objectives = item.ob;
      } else if (subject.name.toLowerCase().includes("math")) {
        const mathTopics = [
          { t: "Number Systems: Whole Numbers, Place Values & Standard Form", st: "Prime factorization, LCM, HCF, indices and representation in standard scientific form.", ob: "Express numbers in index form and compute HCF/LCM using prime factorization." },
          { t: "Fractions, Decimals & Percentages: Conversion & Real-World Operations", st: "Operations on mixed numbers, recurring decimals, percentage increase and decrease.", ob: "Solve multi-step financial problems involving discounts, profit margins, and sales tax." },
          { t: "Algebraic Expressions: Simplification & Expanding Brackets", st: "Like and unlike terms, distributive law, grouping techniques, coefficient rules.", ob: "Expand and simplify algebraic terms containing multiple variables and parenthesis." },
          { t: "Linear Equations in One Variable & Word Problem Modeling", st: "Balancing equations, transposition, formulating algebraic equations from word statements.", ob: "Translate real-life quantitative scenarios into linear equations and solve for unknown values." },
          { t: "Geometry: Angles, Parallel Lines & Transversals", st: "Alternate, corresponding, interior opposite angles, vertically opposite angles.", ob: "Calculate missing angles across intersecting lines and geometric configurations." },
          { t: "Mid-Term Review & Continuous Assessment (CA 1 & 2 Evaluations)", st: "Comprehensive problem-solving clinic covering arithmetic, algebra, and basic geometry.", ob: "Demonstrate timed problem-solving mastery on CA test sheets." },
          { t: "Plane Shapes & Mensuration: Perimeters and Areas", st: "Triangles, parallelograms, trapezia, circles (circumference and area formula $\\pi r^2$).", ob: "Calculate perimeters and composite areas of complex geometric figures." },
          { t: "Ratio, Rates & Proportions: Direct and Inverse Variation", st: "Sharing quantities in given ratios, speed-distance-time rates, unit pricing.", ob: "Solve direct and inverse proportion problems and calculate unitary rates." },
          { t: "Statistics: Data Collection, Frequency Tables & Bar/Pie Charts", st: "Tally charts, grouped frequency tables, sector angles calculation for pie charts.", ob: "Organize raw data into frequency distributions and plot accurate statistical charts." },
          { t: "Measures of Central Tendency: Mean, Median, Mode & Range", st: "Ungrouped data analysis, modal class identification, statistical interpretation.", ob: "Calculate mean, median, and modal values and interpret data distributions." },
          { t: "Probability: Theoretical & Experimental Likelihood", st: "Sample spaces, probability scale (0 to 1), simple chance experiments (dice, coins).", ob: "Determine theoretical probabilities of mutually exclusive simple events." },
          { t: "Comprehensive Revision & Terminal Examination Preparation", st: "Review of all term topics, step-by-step working guidelines, WAEC/BECE style problems.", ob: "Demonstrate high analytical accuracy across terminal examination problem sets." },
        ];
        const item = mathTopics[i] || mathTopics[0];
        topic = item.t;
        subtopics = item.st;
        objectives = item.ob;
      }

      return {
        weekNumber: weekNum,
        topic,
        subtopics,
        objectives,
        activities,
        resources,
      };
    });
  }, [subject.name]);

  const [schemeWeeks, setSchemeWeeks] = useState<any[]>(
    subject.schemeWeeks && subject.schemeWeeks.length > 0 ? subject.schemeWeeks : defaultScheme
  );
  const [selectedSchemeWeek, setSelectedSchemeWeek] = useState<number>(1);
  const [isSavingScheme, setIsSavingScheme] = useState(false);
  const [schemeToast, setSchemeToast] = useState(false);

  // ==========================================
  // 2. LESSON NOTES STATE
  // ==========================================
  const [selectedNoteWeek, setSelectedNoteWeek] = useState<number>(1);
  const currentSchemeWeekObj = schemeWeeks.find((w) => w.weekNumber === selectedNoteWeek) || schemeWeeks[0];

  const defaultNoteContent = useMemo(() => {
    return `# ${subject.name} — Lesson Note
**Week ${selectedNoteWeek}: ${currentSchemeWeekObj?.topic || "Core Topic"}**
**Class:** ${subject.className} | **Term:** ${currentTerm?.name || "First Term"} | **Session:** ${currentSession?.name || "2026/2027"}

---

### 1. Specific Behavioral Objectives
By the end of this instructional period, the students will be able to:
1. Explain the fundamental definition and underlying principles of ${currentSchemeWeekObj?.topic}.
2. Differentiate between key categories: ${currentSchemeWeekObj?.subtopics}.
3. Apply standard rules and formulas in solving practical classroom exercises independently.

---

### 2. Instructional Materials & References
- **Primary Textbook:** Comprehensive Secondary ${subject.name} (Book 1, 3rd Edition).
- **Instructional Aids:** Concept Flashcards, Audio-visual diagrams, Whiteboard models.
- **Reference URL:** Federal Ministry of Education Standard Curriculum Guidelines.

---

### 3. Detailed Subject Matter Presentation
#### Concept Introduction
${currentSchemeWeekObj?.topic} forms an essential pillar of the secondary school syllabus. In everyday academic and practical applications, understanding how these principles interact enables students to communicate and calculate with rigorous precision.

#### Key Breakdown & Core Points
- **Foundation Rule 1:** Ensure all foundational terms are thoroughly defined before advancing to complex multi-step problems.
- **Foundation Rule 2:** Maintain systematic step-by-step documentation in workbooks to demonstrate transparent reasoning.
- **Worked Examples:**
  - *Example 1:* Demonstration of fundamental principle in a standard problem context.
  - *Example 2:* Analysis of common pitfalls and exam-style exceptions.

---

### 4. Classroom Evaluation & Independent Practice
1. Summarize the 3 main characteristics discussed during today's lesson.
2. Complete Exercise 4B (Questions 1 through 6) on page 48 of the primary textbook.

---

### 5. Homework & Extension Assignment
Complete the workbook chapter review worksheet. Submit notebooks at the beginning of the next teaching period.`;
  }, [subject.name, subject.className, selectedNoteWeek, currentSchemeWeekObj]);

  const [noteContent, setNoteContent] = useState<string>(defaultNoteContent);
  const [noteMaterials, setNoteMaterials] = useState<string>("Standard Curriculum Textbook, Illustrated Chart, Whiteboard markers");
  const [noteHomework, setNoteHomework] = useState<string>("Complete Exercises 1 to 5 on textbook page 52. Submit on next scheduled class.");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteToast, setNoteToast] = useState(false);

  useEffect(() => {
    // If an existing note is found in subject.lessonNotes for this week
    const existing = subject.lessonNotes?.find((n) => n.weekNumber === selectedNoteWeek);
    if (existing) {
      setNoteContent(existing.content);
      setNoteMaterials(existing.learningMaterials || "");
      setNoteHomework(existing.homework || "");
    } else {
      setNoteContent(defaultNoteContent);
    }
  }, [selectedNoteWeek, defaultNoteContent, subject.lessonNotes]);

  // ==========================================
  // 3. LESSON PLAN STATE
  // ==========================================
  const [selectedPlanWeek, setSelectedPlanWeek] = useState<number>(1);
  const planWeekObj = schemeWeeks.find((w) => w.weekNumber === selectedPlanWeek) || schemeWeeks[0];
  const [planDuration, setPlanDuration] = useState<number>(40);
  const [planObjectives, setPlanObjectives] = useState<string>(planWeekObj?.objectives || "Identify and analyze key subject concepts.");
  const [planMaterials, setPlanMaterials] = useState<string>("Textbook, Whiteboard, Flashcards, Handout sheets");
  const [planPreviousKnowledge, setPlanPreviousKnowledge] = useState<string>("Students are familiar with the preceding week's introductory terminology.");
  const [planEvaluation, setPlanEvaluation] = useState<string>("Teacher asks oral diagnostic questions and inspects student chalkboard working.");
  const [planConclusion, setPlanConclusion] = useState<string>("Teacher summarizes the lesson's main takeaways and assigns workbook homework.");
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planToast, setPlanToast] = useState(false);

  useEffect(() => {
    const existing = subject.lessonPlans?.find((p) => p.weekNumber === selectedPlanWeek);
    if (existing) {
      setPlanDuration(existing.durationMinutes || 40);
      setPlanObjectives(existing.behavioralObjectives || planWeekObj?.objectives);
      setPlanMaterials(existing.instructionalMaterials || "Textbook, Whiteboard, Charts");
      setPlanPreviousKnowledge(existing.previousKnowledge || "Students have foundational familiarity.");
      setPlanEvaluation(existing.evaluation || "Oral questions and worksheet inspection.");
      setPlanConclusion(existing.conclusion || "Summary and homework assignment.");
    } else {
      setPlanDuration(40);
      setPlanObjectives(planWeekObj?.objectives);
      setPlanMaterials("Textbook, Whiteboard, Charts");
      setPlanPreviousKnowledge("Students have foundational familiarity.");
      setPlanEvaluation("Oral questions and worksheet inspection.");
      setPlanConclusion("Summary and homework assignment.");
    }
  }, [selectedPlanWeek, planWeekObj, subject.lessonPlans]);

  // ==========================================
  // 4. SCORES UPLOAD & ASSESSMENT ENTRY STATE
  // ==========================================
  const [studentScoreRows, setStudentScoreRows] = useState<
    Array<{
      studentId: string;
      admissionNumber: string;
      name: string;
      ca1: number;
      ca2: number;
      ca3: number;
      exam: number;
      total: number;
      grade: string;
    }>
  >(() => {
    return (subject.students || []).map((st) => {
      const studentScores = subject.scores?.filter((sc) => sc.studentId === st.id) || [];
      const ca1 = studentScores.find((sc) => sc.typeCode === "CA1" || sc.typeName.toLowerCase().includes("first"))?.score ?? 0;
      const ca2 = studentScores.find((sc) => sc.typeCode === "CA2" || sc.typeName.toLowerCase().includes("second"))?.score ?? 0;
      const ca3 = studentScores.find((sc) => sc.typeCode === "CA3" || sc.typeName.toLowerCase().includes("third"))?.score ?? 0;
      const exam = studentScores.find((sc) => sc.typeCode === "EXAM" || sc.typeName.toLowerCase().includes("exam"))?.score ?? 0;
      const total = Math.min(100, ca1 + ca2 + ca3 + exam);

      let grade = "F";
      if (total >= 75) grade = "A";
      else if (total >= 65) grade = "B";
      else if (total >= 50) grade = "C";
      else if (total >= 40) grade = "D";

      return {
        studentId: st.id,
        admissionNumber: st.admissionNumber,
        name: st.name,
        ca1,
        ca2,
        ca3,
        exam,
        total,
        grade,
      };
    });
  });

  // Re-synchronize score rows whenever the active class, students, or scores update
  useEffect(() => {
    setStudentScoreRows(
      (subject.students || []).map((st) => {
        const studentScores = subject.scores?.filter((sc) => sc.studentId === st.id) || [];
        const ca1 = studentScores.find((sc) => sc.typeCode === "CA1" || sc.typeName.toLowerCase().includes("first"))?.score ?? 0;
        const ca2 = studentScores.find((sc) => sc.typeCode === "CA2" || sc.typeName.toLowerCase().includes("second"))?.score ?? 0;
        const ca3 = studentScores.find((sc) => sc.typeCode === "CA3" || sc.typeName.toLowerCase().includes("third"))?.score ?? 0;
        const exam = studentScores.find((sc) => sc.typeCode === "EXAM" || sc.typeName.toLowerCase().includes("exam"))?.score ?? 0;
        const total = Math.min(100, ca1 + ca2 + ca3 + exam);

        let grade = "F";
        if (total >= 75) grade = "A";
        else if (total >= 65) grade = "B";
        else if (total >= 50) grade = "C";
        else if (total >= 40) grade = "D";

        return {
          studentId: st.id,
          admissionNumber: st.admissionNumber,
          name: st.name,
          ca1,
          ca2,
          ca3,
          exam,
          total,
          grade,
        };
      })
    );
  }, [subject.classId, subject.students, subject.scores]);

  const [scoreSearch, setScoreSearch] = useState("");
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [scoreSaveToast, setScoreSaveToast] = useState(false);

  // Scoresheet Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadRawText, setUploadRawText] = useState("");
  const [parsedUploadList, setParsedUploadList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Score Calculations
  const filteredScoreRows = studentScoreRows.filter((r) => {
    const q = scoreSearch.toLowerCase().trim();
    return !q || r.name.toLowerCase().includes(q) || r.admissionNumber.toLowerCase().includes(q);
  });

  const subjectAverage = studentScoreRows.length
    ? Math.round((studentScoreRows.reduce((acc, r) => acc + r.total, 0) / studentScoreRows.length) * 10) / 10
    : 0;
  const highestScore = studentScoreRows.length ? Math.max(...studentScoreRows.map((r) => r.total)) : 0;
  const lowestScore = studentScoreRows.length ? Math.min(...studentScoreRows.map((r) => r.total)) : 0;
  const passCount = studentScoreRows.filter((r) => r.total >= 50).length;
  const passRate = studentScoreRows.length ? Math.round((passCount / studentScoreRows.length) * 100) : 100;
  const distinctionCount = studentScoreRows.filter((r) => r.total >= 75).length;

  function handleScoreChange(studentId: string, field: "ca1" | "ca2" | "ca3" | "exam", value: number) {
    setStudentScoreRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        const boundedVal = field === "exam" ? Math.max(0, Math.min(70, value)) : Math.max(0, Math.min(10, value));
        const updated = { ...row, [field]: boundedVal };
        const total = updated.ca1 + updated.ca2 + updated.ca3 + updated.exam;
        let grade = "C";
        if (total >= 75) grade = "A";
        else if (total >= 65) grade = "B";
        else if (total >= 50) grade = "C";
        else if (total >= 40) grade = "D";
        else grade = "F";

        return { ...updated, total, grade };
      })
    );
  }

  // Save All Scores to Database
  async function handleSaveAllScores(overrideRows?: typeof studentScoreRows) {
    setIsSavingScores(true);
    const rowsToSave = overrideRows || studentScoreRows;
    try {
      const payload = {
        classId: subject.classId,
        subjectId: subject.id,
        sessionId: currentSession?.id,
        termId: currentTerm?.id,
        studentScores: rowsToSave.map((r) => ({
          studentId: r.studentId,
          ca1: r.ca1,
          ca2: r.ca2,
          ca3: r.ca3,
          exam: r.exam,
        })),
      };

      const res = await fetch("/api/classroom/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save assessment scores");
      }

      setScoreSaveToast(true);
      setTimeout(() => setScoreSaveToast(false), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving scores");
    } finally {
      setIsSavingScores(false);
    }
  }

  // Save Scheme of Work
  async function handleSaveScheme() {
    setIsSavingScheme(true);
    try {
      const res = await fetch("/api/subjects/scheme-of-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          classId: subject.classId,
          weeksData: schemeWeeks,
        }),
      });
      if (!res.ok) throw new Error("Failed to save scheme of work");
      setSchemeToast(true);
      setTimeout(() => setSchemeToast(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving scheme of work");
    } finally {
      setIsSavingScheme(false);
    }
  }

  // Save Lesson Note
  async function handleSaveLessonNote() {
    setIsSavingNote(true);
    try {
      const res = await fetch("/api/subjects/lesson-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          classId: subject.classId,
          weekNumber: selectedNoteWeek,
          topic: currentSchemeWeekObj?.topic || `Week ${selectedNoteWeek} Topic`,
          subtopics: currentSchemeWeekObj?.subtopics,
          content: noteContent,
          learningMaterials: noteMaterials,
          homework: noteHomework,
        }),
      });
      if (!res.ok) throw new Error("Failed to save lesson note");
      setNoteToast(true);
      setTimeout(() => setNoteToast(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving lesson note");
    } finally {
      setIsSavingNote(false);
    }
  }

  // Save Lesson Plan
  async function handleSaveLessonPlan() {
    setIsSavingPlan(true);
    try {
      const res = await fetch("/api/subjects/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          classId: subject.classId,
          weekNumber: selectedPlanWeek,
          topic: planWeekObj?.topic || `Week ${selectedPlanWeek} Topic`,
          durationMinutes: planDuration,
          behavioralObjectives: planObjectives,
          instructionalMaterials: planMaterials,
          previousKnowledge: planPreviousKnowledge,
          evaluation: planEvaluation,
          conclusion: planConclusion,
        }),
      });
      if (!res.ok) throw new Error("Failed to save lesson plan");
      setPlanToast(true);
      setTimeout(() => setPlanToast(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving lesson plan");
    } finally {
      setIsSavingPlan(false);
    }
  }

  // Download CSV Template
  function handleDownloadTemplate() {
    const headers = ["Admission Number", "Student Name", "CA 1 (Max 10)", "CA 2 (Max 10)", "CA 3 (Max 10)", "Exam (Max 70)", "Total (Max 100)"];
    const rows = studentScoreRows.map((r) => [
      r.admissionNumber,
      `"${r.name}"`,
      r.ca1,
      r.ca2,
      r.ca3,
      r.exam,
      r.total,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${subject.code}_${subject.className}_Scoresheet_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse Raw Text (Upload Modal)
  function handleParseRawScores(text: string) {
    setUploadRawText(text);
    if (!text.trim()) {
      setParsedUploadList([]);
      return;
    }

    const lines = text.trim().split("\n");
    const results = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/[,\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[0]?.toLowerCase().includes("admission") || parts[0]?.toLowerCase().includes("adm")) {
        continue;
      }

      const adm = parts[0] || "";
      const nameFromText = parts[1] || "";
      const matched = subject.students.find(
        (st) => st.admissionNumber.toLowerCase() === adm.toLowerCase() || (nameFromText && st.name.toLowerCase().includes(nameFromText.toLowerCase()))
      );

      const ca1 = Math.max(0, Math.min(10, parseInt(parts[2], 10) || 0));
      const ca2 = Math.max(0, Math.min(10, parseInt(parts[3], 10) || 0));
      const ca3 = Math.max(0, Math.min(10, parseInt(parts[4], 10) || 0));
      const exam = Math.max(0, Math.min(70, parseInt(parts[5], 10) || 0));
      const total = ca1 + ca2 + ca3 + exam;

      results.push({
        studentId: matched?.id || "",
        studentName: matched?.name || nameFromText || "Unknown Pupil",
        admissionNo: matched?.admissionNumber || adm,
        ca1,
        ca2,
        ca3,
        exam,
        total,
        isValid: !!matched,
      });
    }

    setParsedUploadList(results);
  }

  // Ingest Parsed Upload Scores
  async function handleApplyUploadedScores() {
    const valid = parsedUploadList.filter((p) => p.isValid && p.studentId);
    if (valid.length === 0) {
      alert("No matched student records found in the pasted data.");
      return;
    }

    const updatedRows = studentScoreRows.map((r) => {
      const found = valid.find((v) => v.studentId === r.studentId);
      if (!found) return r;
      const total = found.ca1 + found.ca2 + found.ca3 + found.exam;
      let grade = "F";
      if (total >= 75) grade = "A";
      else if (total >= 65) grade = "B";
      else if (total >= 50) grade = "C";
      else if (total >= 40) grade = "D";
      else grade = "F";

      return {
        ...r,
        ca1: found.ca1,
        ca2: found.ca2,
        ca3: found.ca3,
        exam: found.exam,
        total,
        grade,
      };
    });

    setStudentScoreRows(updatedRows);
    setIsUploadModalOpen(false);

    // Persist immediately to database
    await handleSaveAllScores(updatedRows);
  }

  return (
    <div className="space-y-6 salamah-enter">
      {/* Top Banner & Context */}
      <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl border border-[#dfba73]/40 bg-slate-950 px-3.5 py-2 text-xs font-bold text-[#dfba73] hover:text-white hover:border-[#dfba73] hover:bg-[#dfba73]/20 transition shadow-xs"
                title="Return to Staff Dashboard"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>Back to Dashboard</span>
              </Link>

              {isSuperAdmin && (
                <Link
                  href="/dashboard/subjects"
                  className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                  title="View Full Curriculum Catalogue"
                >
                  <span>Catalogue</span>
                </Link>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300 border border-blue-500/30">
                  {subject.code}
                </span>
                {availableClasses && availableClasses.length > 1 ? (
                  <select
                    value={subject.classId}
                    onChange={(e) => navigateToClass(e.target.value)}
                    className="rounded-lg border border-teal-500/40 bg-slate-950 px-2.5 py-1 text-xs font-bold text-teal-300 focus:outline-none focus:border-[#dfba73] cursor-pointer"
                  >
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class: {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                    {subject.className}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  • {currentSession?.name || "2026/2027"} ({currentTerm?.name || "First Term"})
                </span>
              </div>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-white">
                {subject.name} Teaching Cockpit
              </h2>

              {/* Assigned Subject Teacher Control */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] font-bold text-slate-400">Subject Teacher:</span>
                {assignedTeacher ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                      {assignedTeacher.name} {assignedTeacher.staffNumber ? `(${assignedTeacher.staffNumber})` : ""}
                    </span>
                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacherId(assignedTeacher.id);
                            setIsTeacherModalOpen(true);
                          }}
                          className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white"
                          title="Change Assigned Teacher"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleUnassignTeacher}
                          className="rounded-md bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60"
                          title="Unassign Teacher"
                        >
                          Unassign
                        </button>
                      </>
                    )}
                  </div>
                ) : isSuperAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeacherId(teachers?.[0]?.id || "");
                      setIsTeacherModalOpen(true);
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 underline font-medium"
                  >
                    + Assign Subject Teacher
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">No instructor designated</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Class Enrolment
              </span>
              <span className="font-mono text-lg font-bold text-white">
                {subject.students.length} Pupils
              </span>
            </div>
          </div>
        </div>

        {/* Unattached Subject Notice */}
        {(!availableClasses || availableClasses.length === 0) && (
          <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-amber-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <h4 className="font-bold text-sm text-white">Unattached Subject</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    This subject is not currently assigned to any class stream via a Subject Combination.
                    It will not appear on student assessment score sheets or terminal report cards until its combination is attached to a class.
                  </p>
                </div>
                {isSuperAdmin ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href="/dashboard/subjects?tab=combinations"
                      className="rounded-xl bg-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition"
                    >
                      Go to Subject Combinations
                    </Link>
                    <Link
                      href="/dashboard/classes?tab=combinations"
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                    >
                      Attach Combination to Class
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-amber-300/80 italic pt-1">
                    Please contact the academic administration to attach this subject to an active class curriculum.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4 Pillars Navigation Bar with Smooth Mobile Horizontal Scrolling */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap">
          <button
            onClick={() => setActiveTab("scheme")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "scheme"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>1. Scheme of Work (12 Weeks)</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "notes"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>2. Lesson Notes</span>
          </button>

          <button
            onClick={() => setActiveTab("plans")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "plans"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>3. Lesson Plans</span>
          </button>

          <button
            onClick={() => setActiveTab("scores")}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shadow-xs ${
              activeTab === "scores"
                ? "bg-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/40"
                : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span>4. Scores Upload & Continuous Assessment</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SCHEME OF WORK (WEEKS 1 - 12)                      */}
      {/* ========================================================= */}
      {activeTab === "scheme" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                12-Week Curriculum Scheme of Work
              </h3>
              <p className="text-xs text-slate-400">
                Week-by-week instructional breakdown with behavioral objectives, sub-topics, classroom activities, and resources.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {schemeToast && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Scheme saved successfully!</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Scheme</span>
              </button>

              <button
                type="button"
                onClick={handleSaveScheme}
                disabled={isSavingScheme}
                className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingScheme ? "Saving..." : "Save Scheme"}</span>
              </button>
            </div>
          </div>

          {/* Scheme Cards / Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {schemeWeeks.map((week) => (
              <div
                key={week.weekNumber}
                className="rounded-3xl border border-slate-800 bg-[#092233] p-5 shadow-sm space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="rounded-md bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                    Week {week.weekNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNoteWeek(week.weekNumber);
                      setSelectedPlanWeek(week.weekNumber);
                      setActiveTab("notes");
                    }}
                    className="text-[11px] font-bold text-[#dfba73] hover:underline flex items-center gap-1"
                  >
                    <span>Open Note & Plan</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={week.topic}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSchemeWeeks((prev) =>
                        prev.map((w) => (w.weekNumber === week.weekNumber ? { ...w, topic: val } : w))
                      );
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-[#dfba73] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Subtopics & Content Breakdown
                  </label>
                  <textarea
                    rows={2}
                    value={week.subtopics}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSchemeWeeks((prev) =>
                        prev.map((w) => (w.weekNumber === week.weekNumber ? { ...w, subtopics: val } : w))
                      );
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-[#dfba73] focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Performance Objectives
                    </span>
                    <input
                      type="text"
                      value={week.objectives}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSchemeWeeks((prev) =>
                          prev.map((w) => (w.weekNumber === week.weekNumber ? { ...w, objectives: val } : w))
                        );
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Teaching Aids & Resources
                    </span>
                    <input
                      type="text"
                      value={week.resources}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSchemeWeeks((prev) =>
                          prev.map((w) => (w.weekNumber === week.weekNumber ? { ...w, resources: val } : w))
                        );
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 focus:border-[#dfba73] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LESSON NOTES                                       */}
      {/* ========================================================= */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Select Week:</label>
              <select
                value={selectedNoteWeek}
                onChange={(e) => setSelectedNoteWeek(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-[#dfba73] focus:outline-none"
              >
                {schemeWeeks.map((w) => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    Week {w.weekNumber}: {w.topic.slice(0, 45)}...
                  </option>
                ))}
              </select>

              <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                {currentSchemeWeekObj?.topic}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {noteToast && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lesson Note Saved!</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Note</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLessonNote}
                disabled={isSavingNote}
                className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingNote ? "Saving..." : "Save Lesson Note"}</span>
              </button>
            </div>
          </div>

          {/* Note Editor Area */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Learning Materials & Text References
                </label>
                <input
                  type="text"
                  value={noteMaterials}
                  onChange={(e) => setNoteMaterials(e.target.value)}
                  placeholder="e.g. Comprehensive Textbook page 42, Geometry sets..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Homework & Extension Exercise
                </label>
                <input
                  type="text"
                  value={noteHomework}
                  onChange={(e) => setNoteHomework(e.target.value)}
                  placeholder="e.g. Exercises 1 - 5 on textbook page 52..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Detailed Lesson Content & Teacher Presentation Notes
              </label>
              <textarea
                rows={16}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-100 focus:border-[#dfba73] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LESSON PLANS                                       */}
      {/* ========================================================= */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-300">Select Week Plan:</label>
              <select
                value={selectedPlanWeek}
                onChange={(e) => setSelectedPlanWeek(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-[#dfba73] focus:outline-none"
              >
                {schemeWeeks.map((w) => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    Week {w.weekNumber}: {w.topic.slice(0, 45)}...
                  </option>
                ))}
              </select>

              <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                {planWeekObj?.topic}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {planToast && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lesson Plan Saved!</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Plan</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLessonPlan}
                disabled={isSavingPlan}
                className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingPlan ? "Saving..." : "Save Lesson Plan"}</span>
              </button>
            </div>
          </div>

          {/* Structured Nigerian Lesson Plan Template */}
          <div className="rounded-3xl border border-slate-800 bg-[#092233] p-6 shadow-xl space-y-5">
            <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Subject & Class</span>
                <span className="font-bold text-white text-sm">{subject.name} • {subject.className}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Period Duration</span>
                <input
                  type="number"
                  value={planDuration}
                  onChange={(e) => setPlanDuration(parseInt(e.target.value, 10) || 40)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-white font-mono w-24 focus:border-[#dfba73] focus:outline-none"
                />
                <span className="text-slate-400 text-[10px] ml-1">mins</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Academic Session</span>
                <span className="font-semibold text-slate-200">2026/2027 • Term 2</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Teacher</span>
                <span className="font-semibold text-teal-300">Staff Assigned</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  1. Specific Behavioral Objectives
                </label>
                <textarea
                  rows={3}
                  value={planObjectives}
                  onChange={(e) => setPlanObjectives(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-[#dfba73] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  2. Previous Knowledge / Entry Behavior
                </label>
                <textarea
                  rows={3}
                  value={planPreviousKnowledge}
                  onChange={(e) => setPlanPreviousKnowledge(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-[#dfba73] focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Standard 5 Instructional Steps */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#dfba73] block">
                3. Instructional Steps & Pedagogical Delivery
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-teal-300 shrink-0">Step 1 (5 mins):</span>
                  <div className="text-slate-200">
                    <strong>Introduction & Stimulus:</strong> Teacher reviews previous knowledge, introduces the topic with an illustrative hook or daily scenario, and states the lesson objectives.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-teal-300 shrink-0">Step 2 (15 mins):</span>
                  <div className="text-slate-200">
                    <strong>Content Presentation:</strong> Teacher systematically explains the concept, provides blackboard definitions, demonstrates worked examples, and addresses pupil questions.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-teal-300 shrink-0">Step 3 (10 mins):</span>
                  <div className="text-slate-200">
                    <strong>Guided Pupil Practice:</strong> Pupils solve illustrative exercises on chalkboards or in pairs while teacher moves through aisles offering targeted scaffolding.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-teal-300 shrink-0">Step 4 (7 mins):</span>
                  <div className="text-slate-200">
                    <strong>Formative Evaluation:</strong> Individual check-for-understanding questions and spot-checking notebooks to ascertain mastery before lesson conclusion.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-teal-300 shrink-0">Step 5 (3 mins):</span>
                  <div className="text-slate-200">
                    <strong>Summary & Assignment:</strong> Teacher recaps core principles and assigns workbook practice for submission in the next period.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  4. Evaluation Criteria & Method
                </label>
                <input
                  type="text"
                  value={planEvaluation}
                  onChange={(e) => setPlanEvaluation(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  5. Conclusion & Follow-up Assignment
                </label>
                <input
                  type="text"
                  value={planConclusion}
                  onChange={(e) => setPlanConclusion(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-[#dfba73] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SCORES UPLOAD & ASSESSMENT ENTRY                   */}
      {/* ========================================================= */}
      {activeTab === "scores" && (
        <div className="space-y-6">
          {/* 1. Class Navigation Strip for this Subject */}
          <div className="rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#dfba73]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Navigate Class Scoresheets ({availableClasses?.length || 1} Classes taking {subject.name})
                </span>
              </div>
              <span className="text-xs text-slate-300">
                Active Stream: <strong className="text-teal-300">{subject.className}</strong> • {studentScoreRows.length} Enrolled Scholars
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(availableClasses && availableClasses.length > 0
                ? availableClasses
                : [{ id: subject.classId, name: subject.className, studentCount: subject.students.length }]
              ).map((cls) => {
                const isActive = cls.id === subject.classId;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => navigateToClass(cls.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                      isActive
                        ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-slate-950 shadow-md ring-2 ring-amber-300/60"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-[#dfba73]/40"
                    }`}
                  >
                    <span>{cls.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                        isActive
                          ? "bg-slate-950/20 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {cls.studentCount ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Top Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#092233] p-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] block">
                Continuous Assessment & Examination System
              </span>
              <h3 className="font-serif text-lg font-bold text-white">
                {subject.name} Scoresheet • {subject.className}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition shadow-sm"
                title="Print Official Master Scoresheet"
              >
                <Printer className="h-3.5 w-3.5 text-[#dfba73]" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-[#dfba73] hover:border-[#dfba73]/40 transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-[#dfba73]" />
                <span>Download Template (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadRawText("");
                  setParsedUploadList([]);
                  setIsUploadModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-950/40 px-3.5 py-2 text-xs font-bold text-teal-300 hover:bg-teal-900/50 hover:border-teal-400 transition shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Scoresheet</span>
              </button>

              {scoreSaveToast && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Scores saved successfully!</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => void handleSaveAllScores()}
                disabled={isSavingScores}
                className="flex items-center gap-2 rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingScores ? "Saving..." : "Save All Scores"}</span>
              </button>
            </div>
          </div>

          {/* 3. Search Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter scholar by name or admission number..."
                value={scoreSearch}
                onChange={(e) => setScoreSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#dfba73] focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">
              Displaying {filteredScoreRows.length} of {studentScoreRows.length} scholars
            </span>
          </div>

          {/* 4. Royal Institutional Scoresheet Document (Matching Report Card) */}
          <div className="printable-scoresheet relative overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl border-[6px] border-[#092233] ring-4 ring-[#c5a059]/80 p-6 sm:p-9 space-y-6 print:border-4 print:border-[#092233] print:ring-0 print:shadow-none print:m-0 print:p-6 print:text-black">
            {/* Watermark Crest */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] print:opacity-[0.05]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
                alt=""
                className="w-[480px] h-[480px] object-contain"
              />
            </div>

            {/* Institutional Header with School Crest */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#092233] pb-5 gap-5 relative z-10 pt-2">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative rounded-2xl border-2 border-[#c5a059] p-1.5 bg-gradient-to-br from-amber-50 to-white shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
                    alt="Salamah Crest"
                    className="h-16 w-16 object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-black tracking-tight text-[#092233] uppercase leading-none">
                    SALAMAH INTERNATIONAL SCHOOL
                  </h2>
                  <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-[#8c6b2d] mt-1">
                    Government Accredited • British & Nigerian Curriculum • Cambridge Accredited
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Plot 402, Cadastral Zone, Katsina State, Nigeria
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-l-2 border-slate-200 pl-4">
                <span className="rounded-md bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-wider inline-block">
                  Master Scoresheet
                </span>
                <span className="font-serif font-bold text-[#092233] text-sm mt-1 block">
                  {subject.name}
                </span>
                <span className="font-mono text-xs text-teal-800 font-semibold block">
                  Class: {subject.className}
                </span>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#092233] via-[#0e354e] to-[#092233] px-5 py-2.5 text-white shadow-sm relative z-10">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#dfba73]" />
                <span className="font-serif text-sm font-bold tracking-widest uppercase text-amber-100">
                  Official Continuous Assessment & Examination Scoresheet
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="text-amber-200">
                  Term: <strong className="text-white">{currentTerm?.name || "First Term"}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-200">
                  Session: <strong className="text-white">{currentSession?.name || "2026/2027"}</strong>
                </span>
              </div>
            </div>

            {/* Telemetry Summary Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 rounded-2xl border border-[#c5a059]/40 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-4 relative z-10 text-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">Enrolled Scholars</span>
                <span className="text-xl font-serif font-bold text-slate-900 mt-0.5 block">{studentScoreRows.length} Pupils</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">Subject Average</span>
                <span className="text-xl font-bold text-[#092233] mt-0.5 block">{subjectAverage}%</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">Highest Mark</span>
                <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{highestScore} / 100</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">Lowest Mark</span>
                <span className="text-xl font-bold text-rose-700 mt-0.5 block">{lowestScore} / 100</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">Pass Rate (≥50%)</span>
                <span className="text-xl font-bold text-teal-800 mt-0.5 block">{passRate}% ({passCount}/{studentScoreRows.length})</span>
              </div>
            </div>

            {/* Direct Editable Scoresheet Table */}
            <div className="overflow-x-auto rounded-2xl border-2 border-[#092233] bg-white shadow-xs relative z-10 scrollbar-thin">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-[#092233] text-amber-100 uppercase tracking-wider text-[10px] font-bold border-b border-[#c5a059]">
                  <tr>
                    <th className="p-3 w-8 text-center text-amber-300">#</th>
                    <th className="p-3">Scholar Name</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3 text-center text-amber-300">1st CA (10)</th>
                    <th className="p-3 text-center text-amber-300">2nd CA (10)</th>
                    <th className="p-3 text-center text-amber-300">3rd CA (10)</th>
                    <th className="p-3 text-center text-teal-300">Exam (70)</th>
                    <th className="p-3 text-center font-bold text-white bg-[#0e354e]">Total (100)</th>
                    <th className="p-3 text-center font-bold text-amber-300">Grade</th>
                    <th className="p-3 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900">
                  {studentScoreRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                        No scholars currently enrolled in {subject.className}. Enroll scholars via the Students directory to input continuous assessment scores.
                      </td>
                    </tr>
                  ) : (
                    studentScoreRows.map((row, idx) => {
                      const total = row.total;
                      let gradeBadge = "bg-rose-100 text-rose-800 border-rose-300";
                      if (total >= 75) gradeBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
                      else if (total >= 65) gradeBadge = "bg-blue-100 text-blue-800 border-blue-300";
                      else if (total >= 50) gradeBadge = "bg-amber-100 text-amber-800 border-amber-300";

                      return (
                        <tr key={row.studentId} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                          <td className="p-3 text-center font-mono text-[11px] text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-[#092233]">{row.name}</td>
                          <td className="p-3 font-mono text-teal-800 text-[11px] font-bold">{row.admissionNumber}</td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.ca1}
                              onChange={(e) => handleScoreChange(row.studentId, "ca1", parseInt(e.target.value, 10) || 0)}
                              className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-mono font-bold text-slate-900 shadow-xs focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] focus:outline-none print:border-none print:shadow-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.ca2}
                              onChange={(e) => handleScoreChange(row.studentId, "ca2", parseInt(e.target.value, 10) || 0)}
                              className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-mono font-bold text-slate-900 shadow-xs focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] focus:outline-none print:border-none print:shadow-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.ca3}
                              onChange={(e) => handleScoreChange(row.studentId, "ca3", parseInt(e.target.value, 10) || 0)}
                              className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-mono font-bold text-slate-900 shadow-xs focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] focus:outline-none print:border-none print:shadow-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={70}
                              value={row.exam}
                              onChange={(e) => handleScoreChange(row.studentId, "exam", parseInt(e.target.value, 10) || 0)}
                              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-mono font-bold text-teal-900 shadow-xs focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] focus:outline-none print:border-none print:shadow-none"
                            />
                          </td>
                          <td className="p-3 text-center font-mono font-black text-[#092233] bg-amber-50/40 text-sm">
                            {row.total}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-black border ${gradeBadge}`}>
                              {row.grade}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-700 text-[11px] font-medium">
                            {total >= 75
                              ? "Excellent Mastery"
                              : total >= 65
                              ? "Very Good Performance"
                              : total >= 50
                              ? "Credit Attainment"
                              : total >= 40
                              ? "Pass Level"
                              : "Needs Remediation"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Grading Scale Legend */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[10px] text-slate-700 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
                <span className="font-bold text-[#092233] uppercase tracking-wider">Official Grading Key:</span>
                <span><strong>A*</strong> (90-100%) Distinction</span>
                <span><strong>A</strong> (75-89%) Excellent</span>
                <span><strong>B</strong> (65-74%) Very Good</span>
                <span><strong>C</strong> (50-64%) Good Credit</span>
                <span><strong>D</strong> (40-49%) Pass</span>
                <span><strong>F</strong> (0-39%) Unsatisfactory</span>
              </div>
            </div>

            {/* Signatures & Verification Block */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-3 border-t-2 border-[#092233] relative z-10 text-xs">
              <div className="rounded-2xl bg-amber-50/30 p-4 border border-[#c5a059]/40 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c6b2d] block">
                  Subject Teacher Attestation
                </span>
                <p className="text-[11px] text-slate-700 italic">
                  I hereby certify that the scores recorded above represent a true and verified continuous assessment and examination record for this class.
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Signed: __________________________</span>
                  <span className="font-mono text-[10px] text-teal-800">Verified Instructor</span>
                </div>
              </div>

              <div className="rounded-2xl bg-teal-50/20 p-4 border border-teal-600/30 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                  Head of Department / Academic Directorate Endorsement
                </span>
                <p className="text-[11px] text-slate-700 italic">
                  Approved for computation into official terminal progress reports and institutional archives.
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Certified: __________________________</span>
                  <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Official Institutional Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SCORESHEET UPLOAD & DIRECT PASTE                   */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsUploadModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[88vh] w-full max-w-2xl flex-col rounded-3xl border border-teal-500/50 bg-[#092233] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 p-6 border-b border-slate-800 shrink-0 bg-[#071d2b]">
              <div>
                <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-300">
                  Scoresheet Ingestion Engine
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Upload or Direct Paste Scores ({subject.name})
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 salamah-scrollbar">
              <p className="text-xs text-slate-300 leading-relaxed">
                Copy and paste rows directly from Excel or Google Sheets, or paste CSV text.
                Expected columns: <code className="text-teal-300">Admission No, Student Name, CA 1 (10), CA 2 (10), CA 3 (10), Exam (70)</code>
              </p>

              <textarea
                rows={8}
                value={uploadRawText}
                onChange={(e) => handleParseRawScores(e.target.value)}
                placeholder="Paste data here...&#10;e.g.&#10;SAL-2026-101, Fatima Bello, 8, 9, 8, 54&#10;SAL-2026-102, Ibrahim Musa, 9, 8, 9, 58"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:border-[#dfba73] focus:outline-none"
              />

              {parsedUploadList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      Parsed Preview ({parsedUploadList.length} rows, {parsedUploadList.filter((p) => p.isValid).length} matched):
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-2">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-slate-400 uppercase text-[9px] border-b border-slate-800">
                        <tr>
                          <th className="p-1.5">Match</th>
                          <th className="p-1.5">Pupil</th>
                          <th className="p-1.5">Adm No</th>
                          <th className="p-1.5 text-center">CA 1</th>
                          <th className="p-1.5 text-center">CA 2</th>
                          <th className="p-1.5 text-center">CA 3</th>
                          <th className="p-1.5 text-center">Exam</th>
                          <th className="p-1.5 text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {parsedUploadList.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? "text-slate-200" : "text-rose-400"}>
                            <td className="p-1.5">
                              {row.isValid ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <span className="text-[10px] text-rose-400 font-bold">Unmatched</span>
                              )}
                            </td>
                            <td className="p-1.5 font-bold">{row.studentName}</td>
                            <td className="p-1.5 font-mono">{row.admissionNo}</td>
                            <td className="p-1.5 text-center">{row.ca1}</td>
                            <td className="p-1.5 text-center">{row.ca2}</td>
                            <td className="p-1.5 text-center">{row.ca3}</td>
                            <td className="p-1.5 text-center">{row.exam}</td>
                            <td className="p-1.5 text-center font-bold text-teal-300">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-800 shrink-0 bg-[#071d2b]/60">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUploadedScores}
                disabled={parsedUploadList.filter((p) => p.isValid).length === 0}
                className="rounded-xl bg-[#dfba73] px-5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] disabled:opacity-50 transition shadow-md cursor-pointer"
              >
                Apply Ingested Scores to Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER ASSIGNMENT MODAL */}
      {isTeacherModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTeacherModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-display text-lg font-bold text-white">
                {assignedTeacher ? "Change Subject Teacher" : "Assign Subject Teacher"}
              </h3>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  disabled
                  value={`${subject.name} (${subject.code})`}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400"
                />
              </div>

              {subject.className && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Class Stream</label>
                  <input
                    type="text"
                    disabled
                    value={subject.className}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Teacher *</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.email ? `• ${t.email}` : t.staff_number ? `(${t.staff_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800">
                {assignedTeacher ? (
                  <button
                    type="button"
                    onClick={handleUnassignTeacher}
                    disabled={isSavingTeacher}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
                  >
                    Unassign Teacher
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTeacherModalOpen(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTeacher}
                    className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                  >
                    {isSavingTeacher ? "Saving..." : "Save Teacher"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
