export type Lang = "rw" | "en" | "fr";

export const LANGS: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: "rw", label: "Kinyarwanda", flag: "🇷🇼", native: "Kinyarwanda" },
  { code: "en", label: "English", flag: "🇬🇧", native: "English" },
  { code: "fr", label: "Français", flag: "🇫🇷", native: "Français" },
];

type Dict = Record<string, { rw: string; en: string; fr: string }>;

export const T: Dict = {
  app_title: {
    rw: "Ikizamini cy'Uruhushya rw'Agateganyo rwo Gutwara",
    en: "Provisional Driving License Practice Exam",
    fr: "Examen de Permis de Conduire Provisoire",
  },
  app_subtitle: {
    rw: "Repubulika y'u Rwanda • Igihugu · Iterambere",
    en: "Republic of Rwanda • Practice & Prepare",
    fr: "République du Rwanda • Préparation à l'examen",
  },
  inspired_by: {
    rw: "Byuzuzanya n'ubushishozi bwa Polisi y'u Rwanda",
    en: "Inspired by Rwanda National Police standards",
    fr: "Inspiré des standards de la Police Nationale du Rwanda",
  },
  start_exam: { rw: "Tangira Ikizamini", en: "Start Exam", fr: "Commencer l'examen" },
  resume_exam: { rw: "Komeza Ikizamini", en: "Resume Exam", fr: "Reprendre l'examen" },
  choose_language: { rw: "Hitamo Ururimi", en: "Choose Language", fr: "Choisir la langue" },
  instructions: { rw: "Amabwiriza", en: "Instructions", fr: "Instructions" },
  instr_1: {
    rw: "Ikizamini kirimo ibibazo 20 byatoranyijwe mu buryo bw'ihitiyemo.",
    en: "Exam contains 20 randomly selected multiple-choice questions.",
    fr: "L'examen contient 20 questions à choix multiples tirées au hasard.",
  },
  instr_2: {
    rw: "Ufite iminota 20 yose hamwe. Igihe kirangira ikizamini kirasozwa.",
    en: "You have 20 minutes total. Time is enforced automatically.",
    fr: "Vous disposez de 20 minutes. Le temps est appliqué automatiquement.",
  },
  instr_3: {
    rw: "Kugira ngo utsinde ugomba kubona nibura amanota 12/20 (60%).",
    en: "Passing mark: 12/20 (60%).",
    fr: "Note de réussite : 12/20 (60%).",
  },
  instr_4: {
    rw: "Ushobora gusubira inyuma no guhindura ibisubizo mbere yo gusoza.",
    en: "You can navigate back and change answers before submitting.",
    fr: "Vous pouvez revenir en arrière et modifier vos réponses avant de valider.",
  },
  question_bank: { rw: "Ikigega cy'ibibazo", en: "Question Bank", fr: "Banque de questions" },
  per_exam: { rw: "Ibibazo bya buri kizamini", en: "Questions per exam", fr: "Questions par examen" },
  duration: { rw: "Igihe", en: "Duration", fr: "Durée" },
  minutes: { rw: "iminota", en: "minutes", fr: "minutes" },
  pass_mark: { rw: "Amanota yo gutsinda", en: "Passing mark", fr: "Note de passage" },
  mcq: { rw: "Ibisubizo byinshi", en: "Multiple Choice", fr: "Choix multiples" },
  question: { rw: "Ikibazo", en: "Question", fr: "Question" },
  of: { rw: "kuri", en: "of", fr: "sur" },
  previous: { rw: "Ibanziriza", en: "Previous", fr: "Précédent" },
  next: { rw: "Ikurikira", en: "Next", fr: "Suivant" },
  finish: { rw: "Soza Ikizamini", en: "Finish Exam", fr: "Terminer l'examen" },
  confirm_finish: {
    rw: "Uremeza ko ushaka gusoza iki kizamini?",
    en: "Are you sure you want to submit this exam?",
    fr: "Êtes-vous sûr de vouloir soumettre cet examen ?",
  },
  time_up: { rw: "Igihe cyararangiye!", en: "Time's up!", fr: "Temps écoulé !" },
  warn_5min: { rw: "Hasigaye iminota 5", en: "5 minutes remaining", fr: "5 minutes restantes" },
  warn_1min: { rw: "Hasigaye umunota 1", en: "1 minute remaining", fr: "1 minute restante" },
  score: { rw: "Amanota", en: "Score", fr: "Score" },
  percentage: { rw: "Ijanisha", en: "Percentage", fr: "Pourcentage" },
  pass: { rw: "WATSINZE", en: "PASSED", fr: "RÉUSSI" },
  fail: { rw: "NTIWATSINZE", en: "FAILED", fr: "ÉCHEC" },
  time_used: { rw: "Igihe wakoresheje", en: "Time used", fr: "Temps utilisé" },
  correct_answers: { rw: "Ibisubizo by'ukuri", en: "Correct answers", fr: "Bonnes réponses" },
  wrong_answers: { rw: "Ibisubizo bibi", en: "Wrong answers", fr: "Mauvaises réponses" },
  unanswered: { rw: "Ibitasubijwe", en: "Unanswered", fr: "Sans réponse" },
  accuracy: { rw: "Ubushobozi", en: "Accuracy", fr: "Précision" },
  review_answers: { rw: "Reba Ibisubizo", en: "Review Answers", fr: "Revoir les réponses" },
  your_answer: { rw: "Igisubizo cyawe", en: "Your answer", fr: "Votre réponse" },
  correct_answer: { rw: "Igisubizo cy'ukuri", en: "Correct answer", fr: "Bonne réponse" },
  explanation: { rw: "Ubusobanuro", en: "Explanation", fr: "Explication" },
  retake: { rw: "Ongera ukore Ikizamini", en: "Retake Exam", fr: "Repasser l'examen" },
  new_exam: { rw: "Ikizamini gishya", en: "New Random Exam", fr: "Nouvel examen aléatoire" },
  home: { rw: "Ahabanza", en: "Home", fr: "Accueil" },
  admin: { rw: "Ubuyobozi", en: "Admin", fr: "Admin" },
  stats: { rw: "Imibare", en: "Statistics", fr: "Statistiques" },
  print: { rw: "Sohora", en: "Print", fr: "Imprimer" },
  download_pdf: { rw: "Kuramo PDF", en: "Download PDF", fr: "Télécharger PDF" },
  no_translation: {
    rw: "",
    en: "This question is only available in Kinyarwanda:",
    fr: "Cette question est uniquement disponible en Kinyarwanda :",
  },
};

export function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang] || T[key].rw;
}