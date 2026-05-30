import mongoose from 'mongoose';
import { FAQSchema } from './src/faqs/schemas/faq.schema';

const FAQS_DATA = [
  {
    "question": "What is the Vicharanashala internship?",
    "answer": "<p>A two-month internship run by Vicharanashala, a research lab at IIT Ropar. You will work on a real open-source project under a mentor, after a short training phase tailored to where you already are. The internship is free — we do not charge, and the work is real.</p>",
    "category": "About the Internship"
  },
  {
    "question": "What is VINS?",
    "answer": "<p><strong>VINS</strong> is the Vicharanashala Internship — an online programme open to anyone who clears our interview. The work is real open-source contribution under a mentor, the certificate is from the Vicharanashala Lab for Education Design at IIT Ropar, and the programme itself is free (we charge nothing). There is no stipend.</p>\n            <p>If you are seeing a yellow VINS panel on your result page, you are selected.</p>",
    "category": "About the Internship"
  },
  {
    "question": "What are the phases of VINS, and what do the badges mean?",
    "answer": "<p>VINS is structured as four phases. Each one is marked by a badge — a small token of where you are in the journey.</p>\n            <ul>\n              <li>🥉 <strong>Bronze (Phase 1)</strong> — a short training period at the start, planned around what you already know. If you arrive already comfortable with the basics, your mentor may skip Bronze and put you straight on to the project.</li>\n              <li>🥈 <strong>Silver (Phase 2)</strong> — the main work. You contribute to a real open-source project under a Vicharanashala mentor. Finishing Bronze and Silver completes your internship and earns the certificate.</li>\n              <li>🥇 <strong>Gold (Phase 3)</strong> — a recognition awarded during Silver if your contribution stands on its own as a meaningful feature, not just a small fix.</li>\n              <li>🏆 <strong>Platinum (Phase 4)</strong> — a standing invitation to come back and visit the lab — a short trip — any time during the year after your internship ends. We help with travel through a small visit stipend.</li>\n            </ul>\n            <p>Most interns finish at Bronze + Silver, and that is exactly what the certificate is for. Gold and Platinum are extras you can pick up if your work makes the case for them. Either way, you walk away with a real open-source contribution to your name and a mentor who knows you well.</p>",
    "category": "About the Internship"
  },
  {
    "question": "Who is the internship for? Are alumni eligible?",
    "answer": "<p>The internship is for <strong>currently-enrolled students</strong> at any college or university — undergraduate, postgraduate, or doctoral. The NOC requirement is the practical reflection of this: we ask for institutional consent that you can commit your time to this internship.</p>\n            <p><strong>Candidates who have already graduated and are not currently enrolled in any programme are not eligible</strong> for this cycle. If you re-enrol later (higher studies, etc.), you are very welcome to apply again in a future cycle.</p>",
    "category": "About the Internship"
  },
  {
    "question": "Is this the same as IIT Ropar's official Summer Research Internship?",
    "answer": "<p>No. Summership 2026 is a VLED Lab initiative. The certificate is issued by the <strong>Vicharanashala Lab for Education Design</strong>, not centrally by the institute. IIT Ropar runs a separate institutional summer research internship through its own office. Do not represent Summership 2026 as equivalent to that programme.</p>",
    "category": "About the Internship"
  },
  {
    "question": "I have to attend my class tomorrow/today/some day — can I take leave?",
    "answer": "<p>Leave is not permitted. If you are also attending classes or exams, you will be relieved from the internship immediately and will need to join the next batch when it starts.</p>",
    "category": "About the Internship"
  },
  {
    "question": "When can I start?",
    "answer": "<p>You can start any time in 2026 — VINS is flexible on the start date — <strong>but there are two things you must hold in mind together</strong>, and one strong recommendation.</p>\n            <p><strong>The hard rule.</strong> Your internship must <strong>finish by 31 December 2026.</strong> That date is non-negotiable.</p>\n            <p><strong>The strong recommendation: start as soon as possible.</strong> The earlier you join, the more of the May–July main cohort you catch — and three things make starting earlier materially better:</p>\n            <ul>\n              <li><strong>Cohort networking.</strong> The batch goes through Bronze together — peer discussions, parallel problem-solving, and lasting connections happen during this window.</li>\n              <li><strong>TA support is concentrated in May–July.</strong> TAs are full-time during this window.</li>\n              <li><strong>Training rolls out with the cohort</strong>, not piecemeal — you get the material with the discussion around it.</li>\n            </ul>",
    "category": "Timing & Dates"
  },
  {
    "question": "How long is the internship?",
    "answer": "<p><strong>Two months from your chosen start date</strong>, with an optional <strong>one-month grace period</strong> if you need it. End must land on or before 31 December 2026.</p>",
    "category": "Timing & Dates"
  },
  {
    "question": "Can I start in July, August or later if I have exams now?",
    "answer": "<p>Yes — but only if your exams genuinely make an earlier start impossible. Wait until your exams are done, then opt in and start. Do not attempt to juggle this internship with ongoing exams. Make sure your chosen start date plus 2 months (or 3 with grace) lands on or before 31 December 2026.</p>",
    "category": "Timing & Dates"
  },
  {
    "question": "Can I start with the cohort and take a relaxation during my exam window?",
    "answer": "<p>No. This is not an arrangement we offer.</p>\n            <p>VINS is a full-attention internship — six to ten hours a day, sometimes more. Splitting that with college exams damages both sides: the project loses momentum, the exams suffer, and the mentor invests in someone who can only half-engage.</p>\n            <p>If your exams fall inside the cohort duration, defer your start to after your exams end, opt in then, and run the internship at full attention.</p>\n            <p><strong>A note on consequences.</strong> If we later learn that a candidate was sitting college exams during their internship period, <strong>we reserve the right to terminate the internship or withhold the certificate at any time</strong> — including after the internship has otherwise been completed.</p>",
    "category": "Timing & Dates"
  },
  {
    "question": "Can I take leave or get an exemption during the internship for an exam scheduled in June?",
    "answer": "<p>The attendance rule is firm — the 55-day continuous window is a non-negotiable part of the internship, and we cannot offer an exemption for an exam during this period. The policy exists because split attention genuinely damages both your exam preparation and your internship work.</p>",
    "category": "Timing & Dates"
  },
  {
    "question": "Are orientation session recordings shared with interns?",
    "answer": "<p>Recordings of the sessions will not be provided. However, we may provide access to an abridged version of a talk or session if we consider it important. We do not guarantee this for every session.</p>",
    "category": "Timing & Dates"
  },
  {
    "question": "What dates do I put on the NOC?",
    "answer": "<p><strong>Default: your chosen start date → your start + 2 months</strong> (with up to 1 month grace), ensuring the end date is on or before 31 December 2026. Pick the earliest start date you can realistically make — the May–July summer window is the main cohort.</p><p>If the NOC will be signed on a specific later date, pick a start date <em>after</em> the signature date.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "Who can sign the NOC?",
    "answer": "<p>Any authorised signatory at your college: HOD, Acting HOD (during holidays), Principal, Dean, Director, or Training & Placement Officer. For dual-degree students, either institution can sign — pick whichever is easier. For IITM BS Online Degree (standalone) students, any officer from the BS office can sign.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "When do I submit the NOC? Is the deadline hard?",
    "answer": "<p>The deadline is <strong>not hard</strong> — there is no specific cut-off date by which the NOC must be uploaded. <strong>But for the internship to actually begin properly, you should submit it as early as possible and join the current summer cohort.</strong></p><p>If you are on VINS you <em>can</em> technically upload your NOC and start later in the year, but <strong>we strongly do not recommend it</strong> — by then your mentor may already be busy with other work, and the cohort + TA support that make this internship genuinely good are concentrated during the summer window.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "What format should I use? Do I need to design it myself?",
    "answer": "<p>No — <strong>we provide a printable NOC format</strong>. Once your result is out and you log in to samagama.in, you will see a <strong>Download blank NOC</strong> button on your dashboard. Take a printout, get it physically signed and stamped by your authorised signatory, scan it, and upload the signed PDF using the <strong>Upload signed NOC</strong> button. You do not need to draft anything yourself.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "What if my college gives me an NOC in their own format?",
    "answer": "<p>A college's own NOC format is acceptable, as long as all four required entries are present:</p><ul><li>The signing authority's <strong>handwritten signature</strong></li><li>The signing authority's <strong>official email address</strong> (we cross-check)</li><li>Your <strong>full name</strong></li><li>Your <strong>signature</strong></li></ul>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "Does it need to be signed by hand?",
    "answer": "<p>Yes. Three things are required:</p><ul><li>The authorised signatory's <strong>handwritten signature</strong></li><li>The <strong>institutional rubber stamp / seal</strong></li><li>The signatory's <strong>email address</strong> — we automatically cross-check with that person</li></ul><p>Digital signatures are not accepted on the PDF path. If a physically-signed printout is impractical, use the email-forward path (§3.7).</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "Can my HOD email the NOC instead of signing a printout?",
    "answer": "<p><strong>Yes — there is a fully-equivalent email-forward path.</strong></p><ol><li>Download the <strong>text NOC</strong> from your dashboard.</li><li>Fill in the student-side fields, then email it to your HOD.</li><li>Your HOD forwards the email to <code>sudarshan@iitrpr.ac.in</code> from their official institutional email with the subject: <code>NOC for my student <Your Full Name></code></li></ol><p>Two non-negotiable conditions: The forward must come from the HOD's official institutional email address, and the subject line must start with <strong><code>NOC for my student</code></strong>.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "How do I download and upload the NOC?",
    "answer": "<p>Both happen on your <strong>dashboard</strong> at samagama.in once your result is out. You will see:</p><ol><li>A compact pill in the dark header bar</li><li>A standalone NOC card on the dashboard</li><li>A NOC section at the bottom of your full Result message</li></ol><p>The two buttons: <strong>Download blank NOC</strong> and <strong>Upload signed NOC (PDF)</strong> — the file must be a PDF of at most 1 MB.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "What if my NOC is not formally verified?",
    "answer": "<p>NOC verification takes time — typically between an hour and one full working day from the moment you upload.</p><p>If you need your offer letter sooner, upload a <strong>self-declaration</strong> on your profile and a <strong>tentative offer letter</strong> will be issued immediately. The formal offer letter follows once your NOC clears verification.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "My online course (Masai, NPTEL, Coursera, etc.) won't issue an NOC. What do I do?",
    "answer": "<p>The internship is open only to candidates currently enrolled in a <strong>full-time degree programme</strong> at a recognised college or university. Online-only courses do not by themselves make a candidate eligible.</p><p>If you are concurrently enrolled in a full-time degree programme alongside the online course, obtain a NOC from that college.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "My HOD wants written confirmation before signing my NOC. What do I show them?",
    "answer": "<p>Use the <strong>tentative offer letter</strong> route:</p><ol><li>Log in to samagama.in and open your profile</li><li>Upload a brief <strong>self-declaration</strong></li><li>A <strong>tentative offer letter</strong> is issued immediately</li><li>Hand it to your HOD — it serves as written confirmation</li></ol>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "Can Prof. Sudarshan Iyengar or a faculty member from IIT Ropar sign my NOC?",
    "answer": "<p>Your NOC must be signed by an authorised signatory at the institution where you are enrolled as a student. Prof. Sudarshan Iyengar is a faculty member at IIT Ropar and cannot sign your NOC in a personal capacity. An online-only certification course does not meet the eligibility requirement on its own.</p>",
    "category": "NOC (No Objection Certificate)"
  },
  {
    "question": "How do I know I am selected?",
    "answer": "<p>If you can see your yellow VINS result panel on samagama.in, you are selected. There is no separate selection step or confirmation email.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "How do I opt into VINS?",
    "answer": "<p>Tell Yaksha in the chat: <em>\"I want to take up the online internship without stipend.\"</em> Yaksha will confirm. Opting in <strong>is</strong> the selection — no separate confirmation email is sent.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "When do I get the offer letter?",
    "answer": "<p><strong>Path 1 — Formal offer letter (default).</strong> Issued once your signed NOC is verified and you have confirmed your dates.</p><p><strong>Path 2 — Tentative offer letter (faster).</strong> Upload a self-declaration and a tentative offer letter is issued immediately.</p><p>The offer letter lives on your dashboard at samagama.in, not in your email.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "Will I get a certificate?",
    "answer": "<p><strong>Yes — every intern who completes the internship gets a certificate</strong> from Vicharanashala, IIT Ropar. Candidates who drop out mid-way do not get a certificate.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "How do I confirm my internship dates?",
    "answer": "<p>On the dashboard, you will see a yellow card titled <strong>\"🗓️ Confirm your internship dates\"</strong>. Edit dates to your earliest realistic start — your end must be on or before <strong>31 December 2026</strong>. You can save your dates before or after uploading your NOC.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "I am a minor/major in AI student — can I join the programme?",
    "answer": "<p>Minor/Major in AI course from IIT Ropar is a certification course and there will be a different track of internship equivalent. Kindly write to us separately. You should be a registered student in a UG/PG programme. This internship is exclusively meant for students, not working professionals.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "How do I accept the offer letter?",
    "answer": "<p><strong>Reply All</strong> on the offer-letter thread and paste the acceptance statement <strong>exactly as printed</strong>:</p><blockquote>I, [Full Name], confirm that I have read, understood, and accepted all terms, conditions, and obligations set out in this offer letter and in the program FAQ at samagama.in. I formally accept the offer of Summer Internship 2026.</blockquote><p><strong>Copy-paste this sentence as-is.</strong> The reply must reach us within <strong>5 days</strong>.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "What if I reply without using the exact acceptance format?",
    "answer": "<p>The offer is <strong>withdrawn</strong>, effective immediately. This is a deliberate attention-to-detail check.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "I received a withdrawal email — can it be reversed?",
    "answer": "<p>There is an appeal path. Send a <strong>fresh email</strong> to <code>sudarshansudarshan@gmail.com</code> with the subject exactly: <strong>Request to Reconsider: Confirmation Reply Error</strong>. If the reason is genuine, we will respond within 24 hours.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "What happens after I send my acceptance? My dashboard doesn't update.",
    "answer": "<p>The dashboard does <strong>not</strong> track the acceptance email. This is normal. We process acceptance emails manually. If your reply was compliant, no further action is needed.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "Can I change my internship dates?",
    "answer": "<p><strong>Before the offer letter:</strong> yes — edit via the dashboard card. <strong>After the offer letter:</strong> no, dates are final.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "When and how do I get the Zoom link for the kickoff meeting?",
    "answer": "<p>The Zoom link is delivered via <strong>email</strong> and your <strong>Yaksha chat portal</strong>. The kickoff is for the main summer cohort only.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "My NOC is not ready but my start date is approaching. What do I do?",
    "answer": "<p>Upload a <strong>self-declaration</strong> — a tentative offer letter is issued immediately. You then have a 15-day window to upload the proper signed NOC.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "When does my internship actually begin?",
    "answer": "<p>Your internship begins on the <strong>start date you confirmed</strong> on the dashboard. There is no separate \"your internship has begun\" notification.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "Can I switch from VINS (online) to VISE (offline)?",
    "answer": "<p>The two tracks are finalised at the interview stage, and we do not move candidates between them. VISE has a fixed on-campus capacity.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "Can I change my internship dates after the offer letter?",
    "answer": "<p><strong>No.</strong> Once your offer letter has been issued, the dates are final.</p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "How do I get the link for daily Zoom standups? Are they mandatory?",
    "answer": "<p>Daily Zoom standup links are posted in the <strong>Announcements section</strong> on samagama.in. <strong>Attending daily standups is mandatory for all interns.</strong></p>",
    "category": "Selection, Offer Letter & Certificate"
  },
  {
    "question": "What will I work on?",
    "answer": "<p>A real open-source project from Vicharanashala's portfolio — assigned based on your background. Areas range across AI/ML, web development, NLP, computer vision, agriculture-tech (Annam.AI), education-tech (ViBe), and open-source infrastructure.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "How many hours per day?",
    "answer": "<p>Plan for <strong>6 to 10 hours a day</strong>, sometimes more during the build phase. This is a full-time internship.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "Who is my mentor?",
    "answer": "<p>You will work with the lab's research and engineering team. The exact mentor depends on the project. The model is fluid — you will get help from a senior researcher one day, a peer the next.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "Is there a stipend?",
    "answer": "<p>No. The internship is unpaid. Stellar performers may be recognised with a discretionary stipend at the lab's option, but this is not promised or expected.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "Do I need my own laptop? Should I preload any software?",
    "answer": "<p><strong>Yes — a personal laptop is required.</strong> We prefer Linux or macOS. If you use Windows, install WSL or PuTTY.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "I am using a different email on GitHub / Zoom / the learning platform. Is that okay?",
    "answer": "<p>No. <strong>Your registered email is your sole identifier across all programme platforms.</strong> Mismatches cannot be retroactively corrected.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "Why has my mentor not been assigned yet?",
    "answer": "<p>Mentors are not assigned on day 1. You will be assigned a mentor when you move on to the <strong>project phase</strong>, after completing the mandatory Bronze coursework.</p>",
    "category": "Work, Mentorship & Projects"
  },
  {
    "question": "What are the official communication channels?",
    "answer": "<ol><li><strong>Announcements section on samagama.in</strong> — all programme notifications</li><li><strong>Yaksha chat</strong> on samagama.in — primary channel for questions. Use <code>#escalate</code> to reach a human.</li><li><strong>Discussion forum</strong> — for peer discussions</li><li><strong>Email to sudarshansudarshan@gmail.com</strong> — last resort only</li></ol><p><strong>WhatsApp support is cancelled.</strong> Unofficial groups are strictly prohibited and will lead to immediate termination.</p>",
    "category": "Code of Conduct — Communication Channels"
  },
  {
    "question": "My interview is not marked as complete on the dashboard — what do I do?",
    "answer": "<p>A data-sync issue sometimes occurs. The team will check your record and manually mark it as complete if needed. You will be unblocked within 1–2 hours. If the issue persists, email sudarshansudarshan@gmail.com.</p>",
    "category": "Interviews Related"
  },
  {
    "question": "Does Vicharanashala send a grade report to my university?",
    "answer": "<p>No. The certificate issued upon completion is the document you can submit to your college. We don't have a process for sending grade reports to universities.</p>",
    "category": "Certificate"
  },
  {
    "question": "Does the certificate specify whether it was completed online or offline?",
    "answer": "<p>No. The certificate is the same for both tracks and does not specify the mode.</p>",
    "category": "Certificate"
  },
  {
    "question": "Will the certificate be a physical hardcopy or an e-certificate?",
    "answer": "<p>It is issued as an e-certificate — downloaded from your dashboard. We do not print and mail physical copies. It is digitally signed and verifiable.</p>",
    "category": "Certificate"
  },
  {
    "question": "Is there a WhatsApp group for candidates?",
    "answer": "<p>No. See §6.1 for the official communication channels.</p>",
    "category": "Certificate"
  },
  {
    "question": "What is Rosetta?",
    "answer": "<p>Rosetta is your internship journal — a 65-day document, one entry per day, every day. You write in it daily, keep it privately, and submit it at the end of the internship.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "Why does this exist? Is it just busywork?",
    "answer": "<p>No. It exists so you can process and articulate your learning experience. Students who reflect regularly get more out of it. For us, it provides qualitative insight to improve the programme.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "What is a \"thinking routine\"?",
    "answer": "<p>A short framework that gives your reflection a specific shape. Examples: <strong>3-2-1</strong> (3 things you engaged with, 2 questions, 1 surprise), <strong>Muddy / Clear</strong>, <strong>What? So What? Now What?</strong> — the routines rotate across 65 days.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "How do I get my Rosetta journal?",
    "answer": "<p>Shared as a Google Doc template during orientation. Make a copy to your own Drive and rename it <code>Rosetta — [Your Name] — Summership 2026</code>.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "How do I use it day to day?",
    "answer": "<p>Open your doc → scroll to today's entry → fill in the date → read the thinking routine → answer the prompts. It takes 10–20 minutes.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "How long should each entry be?",
    "answer": "<p>No minimum or maximum. Three to five sentences per prompt is usually enough. One-word answers or AI-generated text are not acceptable.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "What is the one rule?",
    "answer": "<p><strong>Write what is true.</strong> Not what sounds impressive. If you hated today, write that. If something clicked, write that.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "Can I use ChatGPT or any AI tool to write my entries?",
    "answer": "<p><strong>No.</strong> AI-generated entries will not be counted. The journal must be in your voice, from your actual experience.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "What if I miss a day?",
    "answer": "<p>Fill it in as soon as you can. Write the actual date you are filling it in. A late honest entry is always better than no entry.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "Will anyone read my journal during the internship?",
    "answer": "<p><strong>No.</strong> We read it only after you submit it at the end.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "Can the prompts change mid-internship?",
    "answer": "<p>Occasionally, yes. We will announce changes in the Announcements section on samagama.in.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "How do I submit Rosetta at the end?",
    "answer": "<p>Share your Google Doc with the coordinator's email as <strong>Viewer</strong>. Ensure your name is in the title, all 65 entries are filled, and your cover page is complete.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "I have a question about Rosetta not answered here. What do I do?",
    "answer": "<p>Ask Yaksha first. If Yaksha cannot answer it, escalate to your programme coordinator.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "My college requires written confirmation that the internship is self-paced. What document can I share?",
    "answer": "<p>This is not a self-paced internship, but a very rigorous one which is time demanding. It is not permitted for one to be part of any other activity during this period.</p>",
    "category": "Rosetta — Your Internship Journal"
  },
  {
    "question": "I've previously interned with VLED — am I exempt from any coursework?",
    "answer": "<p><strong>Yes — partially.</strong> If you completed the MERN Stack coursework previously, you don't need to repeat it. However, the <strong>AI Fundamentals course is mandatory for everyone</strong>, including returning interns.</p>",
    "category": "Phase 1 — Coursework, ViBe LMS & Live Sessions"
  },
  {
    "question": "How do I register for the AI Fundamentals course on ViBe?",
    "answer": "<p>Click the registration link in Announcements → Sign in to ViBe with the same Gmail as Samagama → Open the link again after login → Complete the registration form → The course appears on your dashboard.</p>",
    "category": "Phase 1 — Coursework, ViBe LMS & Live Sessions"
  },
  {
    "question": "I registered on ViBe with a different email — is that OK?",
    "answer": "<p>Use the same email on both platforms. If your Samagama email isn't Gmail, tell Yaksha using: <code>#vibe-email your-gmail@gmail.com</code></p>",
    "category": "Phase 1 — Coursework, ViBe LMS & Live Sessions"
  },
  {
    "question": "Are live sessions mandatory if I'm on the viva route?",
    "answer": "<p><strong>Yes — live sessions are mandatory for every intern, regardless of path.</strong></p>",
    "category": "Phase 1 — Coursework, ViBe LMS & Live Sessions"
  },
  {
    "question": "Where do I find the daily live-session schedule?",
    "answer": "<p>In the <strong>Announcements section on samagama.in</strong>, posted at least 1 hour before the session.</p>",
    "category": "Phase 1 — Coursework, ViBe LMS & Live Sessions"
  },
  {
    "question": "I'm unable to type in the chat after clicking 'Interact with Yaksha' — what should I do?",
    "answer": "<p>Scroll up to the top of your window and click on the 'Chat with Yaksha' button to activate Yaksha.</p>",
    "category": "Yaksha Chat Related"
  },
  {
    "question": "How do I log in to ViBe?",
    "answer": "<p>Go to <a href=\"https://vibe.vicharanashala.ai/auth\" target=\"_blank\">vibe.vicharanashala.ai/auth</a>. Sign up as a student with your registered email. Then check Notifications and accept the course invite.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Invite accepted but shows \"No course enrolled\"?",
    "answer": "<p>Check your email, try logging out/in, allow third-party cookies, fix DNS to Google DNS (8.8.8.8 / 8.8.4.4), and flush DNS cache.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Why are videos stuck or repeating?",
    "answer": "<p>Due to ViBe's monitored learning system. Stay on the ViBe tab, keep your camera on, and watch in a quiet, well-lit environment.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Can I use a mobile or tablet?",
    "answer": "<p>No, only <strong>desktop/laptop</strong> is supported.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "How do I troubleshoot video issues on ViBe?",
    "answer": "<p>Try: refresh page → inspect console → log out/in → different browser → clear cache. If the issue persists, mention <code>#escalate-ViBe</code> in Yaksha.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "My progress is showing less than 100% even though I completed everything. What should I do?",
    "answer": "<p>Verify you've completed all items (1006/1006). Try refreshing or clearing cache and logging in again.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Can I request an exception or bypass the ViBe system?",
    "answer": "<p>There is a formal alternative: a three-hour proctored exam with two cameras and a live proctor. Score below 60% = join next cohort. Above 80% = passed. The standard ViBe flow is usually faster.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Is the ViBe consent form compulsory?",
    "answer": "<p>Yes — consent is mandatory. Camera and microphone access are required. Without consent, you cannot proceed with the course.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "What are penalty scores on ViBe?",
    "answer": "<p>Generated when anomalies are detected. They do <strong>not impact your HP or evaluation</strong> — their purpose is ensuring proper engagement.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "When should I use the Flag option on ViBe?",
    "answer": "<p>Use Flag only for content-related issues. For technical/platform issues, contact Yaksha instead.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "What is Linear Progression on ViBe?",
    "answer": "<p>Each learner must watch videos and attempt quizzes in exact order. You cannot skip ahead — each item unlocks after the previous one is completed.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Can I use the left navigation panel to jump ahead?",
    "answer": "<p>No. Use <strong>Next Quiz</strong> or <strong>Next Lesson</strong> on the right panel. Jumping ahead triggers the Access Restricted alert.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "I'm seeing a red \"Access Restricted\" banner. Is this a bug?",
    "answer": "<p>No, it's not a bug. It means you tried to access an item before completing all previous items.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "How do I resolve the \"Access Restricted\" error?",
    "answer": "<p>Go back to the left panel, find the item without a completion tick, complete it, and refresh.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Why does ViBe make me re-watch a clip after a quiz?",
    "answer": "<p>It's part of the design — not a penalty. Re-watches do not affect your HP or evaluation.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "What kinds of quiz questions will I see on ViBe?",
    "answer": "<p>Four formats: <strong>Pick one (MCQ)</strong>, <strong>Pick one or more (MSQ)</strong>, <strong>Type a number (NAT)</strong>, and <strong>True or False</strong>.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Are the same proctoring rules applied to every course?",
    "answer": "<p>No. ViBe's proctoring is <strong>modular</strong> — each check can be independently switched on or off by the instructor.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "What does the \"quiet helper\" on ViBe actually do?",
    "answer": "<p>Checks 5 things in real time: face visible, only one face, enough light, no background voices, and you're looking at the screen. Brief normal movements are fine.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Does ViBe record long videos of me?",
    "answer": "<p>No. ViBe does not continuously record videos of you. Camera and mic are used for real-time checks only.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "What is the most common avoidable mistake?",
    "answer": "<p><strong>Sitting with a window directly behind you.</strong> Move the window to your side or in front of the laptop.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Why does the lesson keep pausing even when I'm paying attention?",
    "answer": "<p>Check: face too dark → add lamp. Face out of frame → adjust position. Background voices → close door. Switched tabs → stay on ViBe. Camera/mic dropped → check browser permissions.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Can I read quiz questions aloud or mutter to myself?",
    "answer": "<p>It's best not to. Watch in silence, answer in silence, and chat freely during breaks.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Can I study with a friend on camera?",
    "answer": "<p>In most courses, no. Only you should be in the camera frame. Discuss concepts before or after a ViBe lesson, not during it.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Will I lose progress if I clear my browser?",
    "answer": "<p>No. Progress is saved on the server, tied to your registered email.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Is there a recommended daily learning rhythm?",
    "answer": "<p>Yes — show up daily, take breaks between clips, and aim for ~3.33% progress per day.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "What should my \"study corner\" look like?",
    "answer": "<p>Light in front of your face, just you in the camera frame, and a reasonably quiet room.</p>",
    "category": "ViBe Platform"
  },
  {
    "question": "Is team formation compulsory?",
    "answer": "<p>Yes. All projects in Phase 2 must be completed in teams.</p>",
    "category": "Team Formation"
  },
  {
    "question": "What is the size of a team?",
    "answer": "<p>Fixed at <strong>four members</strong>.</p>",
    "category": "Team Formation"
  },
  {
    "question": "How are teams formed?",
    "answer": "<p>May 15/16 starters formed teams through a structured activity. Later joiners are randomly assigned.</p>",
    "category": "Team Formation"
  },
  {
    "question": "I started on May 15/16 but couldn't form a team. What happens?",
    "answer": "<p>You will be randomly assigned to a team.</p>",
    "category": "Team Formation"
  },
  {
    "question": "There was a typo in our email addresses during team formation. Can we fix it?",
    "answer": "<p>No action needed. The administration will verify and match email IDs before finalizing teams.</p>",
    "category": "Team Formation"
  },
  {
    "question": "I formed a team with only two members. Will it be considered?",
    "answer": "<p>No. Teams with fewer than four will be expanded by adding additional members.</p>",
    "category": "Team Formation"
  },
  {
    "question": "What if a team member leaves during Phase 1?",
    "answer": "<p>A replacement may be assigned, or you continue as a team of three. Inform the admin immediately.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Can I form a team with someone from my own college?",
    "answer": "<p>No. Teams must consist of members from <strong>different institutions</strong>.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Can I form a team with students from my IIT MBS cohort?",
    "answer": "<p>No. Collaborate with participants outside your existing cohort.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Can we change our team name after submission?",
    "answer": "<p>Yes, team names are tentative and can be changed, but frequent changes are discouraged.</p>",
    "category": "Team Formation"
  },
  {
    "question": "What if multiple teams choose the same name?",
    "answer": "<p>Teams will be distinguished using suffixes (e.g., Team X-1, Team X-2).</p>",
    "category": "Team Formation"
  },
  {
    "question": "What should I do if I face issues within my team?",
    "answer": "<p>Report concerns immediately to your assigned scholar/mentor.</p>",
    "category": "Team Formation"
  },
  {
    "question": "How will I know who my mentor is?",
    "answer": "<p>Your mentor will be the scholar assigned to your team's project.</p>",
    "category": "Team Formation"
  },
  {
    "question": "When will I know my team details?",
    "answer": "<p>Announced in the Announcements section on samagama.in.</p>",
    "category": "Team Formation"
  },
  {
    "question": "My name is not in the team list email. What should I do?",
    "answer": "<p>Announcements are phased — your name may appear in a later list. If still unassigned, raise it on Yaksha.</p>",
    "category": "Team Formation"
  },
  {
    "question": "We were assigned a different project than our top priority. Can we change?",
    "answer": "<p>No. Project assignments are final.</p>",
    "category": "Team Formation"
  },
  {
    "question": "I just started. Can I form my own team now?",
    "answer": "<p>No. Teams will be randomly assigned. Wait for official communication.</p>",
    "category": "Team Formation"
  },
  {
    "question": "When do team activities begin?",
    "answer": "<p>In <strong>Phase 2</strong>. During Phase 1 you do not need to worry about team activities.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Can I request a specific teammate after teams are assigned?",
    "answer": "<p>No. Team assignments are final.</p>",
    "category": "Team Formation"
  },
  {
    "question": "What if a team member is inactive or not contributing?",
    "answer": "<p>Report the issue to your mentor/scholar early.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Can I switch teams if there are conflicts?",
    "answer": "<p>Not allowed except in exceptional admin-approved cases.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Will team performance affect individual evaluation?",
    "answer": "<p>Yes. Team deliverables are a key part of evaluation.</p>",
    "category": "Team Formation"
  },
  {
    "question": "How will communication happen within teams?",
    "answer": "<p>Teams self-organise over <strong>LinkedIn or email</strong> only. WhatsApp team groups are not permitted.</p>",
    "category": "Team Formation"
  },
  {
    "question": "What if I miss the team allocation announcement?",
    "answer": "<p>Check the Announcements section on samagama.in regularly.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Can a team be dissolved and reformed?",
    "answer": "<p>No. Once finalized, teams are locked.</p>",
    "category": "Team Formation"
  },
  {
    "question": "What happens if I drop out of the internship?",
    "answer": "<p>Your team will be adjusted — remaining members continue as a team of three or receive a replacement.</p>",
    "category": "Team Formation"
  },
  {
    "question": "Will we get time to know our teammates before Phase 2?",
    "answer": "<p>Yes. There is typically a buffer period before Phase 2.</p>",
    "category": "Team Formation"
  }
];

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Error: MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Get or define the model
    const FAQModel = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

    console.log('Clearing existing FAQs...');
    await FAQModel.deleteMany({});

    console.log(`Seeding ${FAQS_DATA.length} FAQs...`);
    const mappedData = FAQS_DATA.map(faq => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      view_count: 0
    }));

    await FAQModel.insertMany(mappedData);
    console.log('FAQs seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
