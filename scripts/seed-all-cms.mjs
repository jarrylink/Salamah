import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const sql = neon(process.env.DATABASE_URL);

const allSections = [
  {
    section_key: "hero",
    title: "Salamah International School",
    subtitle: "Welcome to Salamah International School, Nigeria's premier private academy delivering Cambridge International & Nigerian curricula.",
    content: {
      motto: "Learning for Peaceful Co-existence",
      badge: null,
      ctaPrimaryText: "Enrol Your Child Now",
      highlights: [
        { value: "30+", label: "Years of Academic Distinction" },
        { value: "2,850+", label: "Distinguished Scholars Enrolled" },
        { value: "98%", label: "Cambridge & WAEC Examination Pass Rate" },
        { value: "247", label: "Accredited Faculty & Educators" }
      ]
    }
  },
  {
    section_key: "about",
    title: "Our Heritage of Scholarly Rigour & Ethical Distinction",
    subtitle: "Established to provide Federal standard education infused with timeless Islamic values, benchmarked against international Cambridge excellence.",
    content: {
      mission: "To inspire an unquenchable thirst for knowledge, critical inquiry, leadership, and unwavering Islamic character in every child.",
      philosophy: "Education should prepare students for both worldly success and spiritual fulfillment, grounded in Federal curriculum standards and Islamic principles.",
      principalName: "Alhaji Ahmad Zayyana",
      principalTitle: "Founder & Chairman of Governing Council",
      historyText: "Visionary leader with over 30 years of experience in educational development, community service, and institutional governance aligned with Federal standards.",
      stats: [
        { value: "30+", label: "Years Experience" },
        { value: "5", label: "Institutions" },
        { value: "1000+", label: "Scholarships" }
      ]
    }
  },
  {
    section_key: "curriculum",
    title: "Academic Structure & Educational Framework",
    subtitle: "A comprehensive educational pathway aligned with Federal Government standards and Cambridge International benchmarks.",
    content: {
      wings: [
        {
          name: "Early Years Foundation",
          ages: "Ages 2 – 5",
          description: "Federal-approved early childhood education focusing on holistic development, foundational Islamic values, and creative exploration through play-based learning.",
          features: [
            "Montessori-inspired Curriculum",
            "Quranic Memorization Program",
            "Sensory & Motor Skill Development"
          ],
          cta: "Enrol for Nursery"
        },
        {
          name: "Primary Education",
          ages: "Grades 1 – 6",
          description: "National Curriculum integrated with Cambridge Primary, emphasizing character building, academic excellence, and technological literacy.",
          features: [
            "Cambridge Primary Framework",
            "Comprehensive Islamic Studies",
            "STEM Foundation & Robotics"
          ],
          cta: "Enrol for Primary"
        },
        {
          name: "Secondary Education",
          ages: "Grades 7 – 12 (JSS 1 – SS 3)",
          description: "Advanced preparation for WAEC, NECO, and Cambridge IGCSE with university pathway programs and comprehensive career counseling.",
          features: [
            "Dual IGCSE & WAEC Curricula",
            "University Preparation Program",
            "Career Guidance & Mentorship"
          ],
          cta: "Enrol for Secondary"
        }
      ]
    }
  },
  {
    section_key: "programs",
    title: "Integrated Learning Programs",
    subtitle: "Federal-approved programs combining academic excellence with moral values and modern technology.",
    content: {
      items: [
        {
          tag: "Program 01 • Academic Excellence",
          title: "Federal Curriculum & Cambridge Distinction",
          description: "Our academic program is fully aligned with Federal Ministry of Education standards, enhanced by Cambridge International curriculum to provide world-class education while maintaining strong moral values.",
          points: [
            "Federal Accreditation: Fully accredited by Federal Ministry of Education.",
            "Cambridge International: IGCSE and Cambridge Primary certification.",
            "Quality Assurance: Top 5% globally in IGCSE examination results."
          ]
        },
        {
          tag: "Program 02 • Digital Innovation",
          title: "Digital Literacy, STEM & Computer Labs",
          description: "Preparing students for the modern technological age with 3 state-of-the-art computer labs, coding workshops, and STEM programs aligned with national educational standards.",
          metrics: [
            { value: "3", label: "Computer Labs" },
            { value: "100+", label: "Workstations" },
            { value: "24/7", label: "Campus WiFi" }
          ]
        },
        {
          tag: "Program 03 • Moral Leadership",
          title: "Islamic Values, Ethics & Hifz Program",
          description: "Our Islamic studies program integrates Quran memorization, Islamic history, and character development within the Federal educational framework, nurturing scholars who excel academically while maintaining deep spiritual grounding.",
          points: [
            "Quran Memorization (Hifz): Structured Hifz program with certified teachers and daily tajweed recitation.",
            "Character Building & Adab: Imparting Islamic etiquette, truthfulness, and community leadership in service of humanity."
          ]
        }
      ]
    }
  },
  {
    section_key: "proprietress",
    title: "Pioneering Female Academic Leadership & Moral Excellence",
    subtitle: "Dedicated leadership cultivating dignity, academic brilliance, and holistic character for the next generation of distinguished women leaders.",
    content: {
      badge: "Office of the Proprietress",
      name: "Hajiya Asma'u Zayyana",
      role: "Proprietress",
      titleTag: "Pioneer in Girls' Education • Moral Education Authority",
      quote: "When a daughter of our society is endowed with profound moral anchors and world-class scientific intellect, she becomes a source of boundless tranquility, wisdom, and righteous leadership for future generations. At Salamah, we do not merely educate young women; we cultivate the pious custodians of humanity.",
      directorate: "Directorate of the Proprietress",
      educatorId: "Federal Educator #EDU-742",
      pillars: [
        {
          title: "Pastoral Sanctuary",
          desc: "Structured spiritual circles, female mentoring, and compassionate emotional guidance.",
          tag: "Character First"
        },
        {
          title: "Women in STEM",
          desc: "Intensive track record preparing female scholars for medicine, AI, coding, and engineering.",
          tag: "Future Pioneers"
        },
        {
          title: "Quranic Eloquence",
          desc: "Comprehensive Tajweed, Hifz, and public oratory programs grounded in modesty.",
          tag: "Spiritual Mastery"
        }
      ],
      metrics: [
        { value: "1,200+", label: "Female Scholars Graduated" },
        { value: "100%", label: "University Placement Rate" },
        { value: "15+", label: "National Academic Awards" }
      ]
    }
  },
  {
    section_key: "leadership",
    title: "Distinguished School Leadership",
    subtitle: "Operating under the stewardship of the Proprietress, our executive officers ensure rigorous academic standards, student pastoral growth, and fiscal excellence.",
    content: {
      badge: "Executive School Administration",
      officers: [
        {
          name: "Mr. Ahmed Bogunmbe",
          role: "Principal & Chief Academic Officer",
          badge: "Executive Principal",
          directorate: "Directorate of Academic Standards",
          desc: "Leading Cambridge Assessment International Education moderation, Federal curriculum standards, and faculty supervision for secondary education.",
          tags: ["Cambridge Certified", "TRCN Fellow"]
        },
        {
          name: "Hajiya Maryam Zayyana",
          role: "Vice Principal & Academic Administrator",
          badge: "Vice Principal",
          directorate: "Academic Welfare & Administration",
          desc: "Directing student pastoral welfare, faculty coordination across STEM and humanities, and academic synergy upholding moral excellence.",
          tags: ["Pastoral Care Lead", "Faculty Synergist"]
        },
        {
          name: "Hajiya Fatima Zayyana",
          role: "Headmistress (Primary & Early Years)",
          badge: "Headmistress",
          directorate: "Primary & Early Years Directorate",
          desc: "Directing foundational Montessori methodologies, early childhood cognitive development, and structured Quranic phonetic literacy.",
          tags: ["Montessori Director", "Early Foundation"]
        },
        {
          name: "Arch Sani Sule Mashi",
          role: "School Accountant & Bursar",
          badge: "School Accountant",
          directorate: "Financial Directorate & Bursary",
          desc: "Overseeing institutional fiscal governance, student welfare accounts, statutory audit integrity, and transparent resource allocation.",
          tags: ["Financial Controller", "Audit & Compliance"]
        }
      ]
    }
  },
  {
    section_key: "facilities",
    title: "World-Class Academic Infrastructure & Amenities",
    subtitle: "Purposefully centralized within our secured school grounds, our state-of-the-art facilities provide safe, distraction-free learning environments optimized for academic mastery, scientific exploration, and moral discipline without the logistical fragmentation of multiple campuses.",
    content: {
      badge: "School Facilities & Academic Infrastructure",
      items: [
        {
          title: "Ultra-Modern STEM & Computer Labs",
          desc: "Equipped with 100+ high-performance workstations, dedicated high-speed educational network, coding software, and dual science laboratories."
        },
        {
          title: "Grand Islamic Centre & Central Mosque",
          desc: "A serene central sanctuary dedicated to daily congregational prayers, Friday Khutbahs, and the intensive Hifz Quranic memorization program."
        },
        {
          title: "Comprehensive Sports & Athletics Arenas",
          desc: "Synthetic turf pitch, basketball courts, badminton areas, and structured physical development arenas designed for student fitness and team building."
        },
        {
          title: "Smart Digital Classrooms",
          desc: "Interactive 4K digital learning panels, teacher-guided multimedia instruction, and ergonomic learning suites designed for optimal concentration."
        },
        {
          title: "Healthcare & First-Aid Sanctuary",
          desc: "Qualified resident nursing post providing round-the-clock emergency care, routine health screenings, and comprehensive student welfare support."
        },
        {
          title: "Hygienic School Cafeteria",
          desc: "Serving wholesome, nutritious, and balanced halal meals prepared fresh daily under rigorous sanitary and clinical health standards."
        }
      ]
    }
  },
  {
    section_key: "fees",
    title: "Transparent Investment in Your Child's Future",
    subtitle: "Providing unparalleled academic value, certified educators, premium learning environments, and lifetime mentorship.",
    content: {
      currencySymbol: "₦",
      applicationFeeNaira: 25000,
      tuitionSummary: "Tuition packages include all Cambridge learning modules, textbooks, laboratory consumables, smart device software access, and standard extracurriculars.",
      tiers: [
        {
          title: "Day Scholar (JSS 1 – SS 3)",
          price: "₦1,850,000 / term",
          features: [
            "Full academic curriculum",
            "Lunch & afternoon refreshments",
            "All sports clubs & lab supplies",
            "Cambridge examination preparation"
          ]
        },
        {
          title: "Full Boarding Scholar",
          price: "₦3,250,000 / term",
          features: [
            "Executive en-suite boarding room",
            "Nutritious meals & daily snacks",
            "Evening study & weekend mentorship",
            "Laundry, clinic & recreational access"
          ]
        },
        {
          title: "Presidential Merit Scholar",
          price: "Up to 50% Tuition Waiver",
          features: [
            "Awarded to top 3% Olympiad candidates",
            "Comprehensive scholarship covering tuition",
            "Exclusive research mentorship",
            "National academic representation sponsorship"
          ]
        }
      ]
    }
  },
  {
    section_key: "testimonials",
    title: "Voices of Our Distinguished Community",
    subtitle: "What esteemed parents and high-achieving alumni say about their Salamah experience.",
    content: {
      quotes: [
        {
          quote: "Salamah transformed my daughter not just into a straight-A Cambridge scholar, but gave her profound humility, moral character, and eloquence. She has now been admitted to Imperial College London with distinction.",
          author: "Hajiya Maryam Al-Hassan",
          designation: "Executive Director, Federal Ministry of Finance & Parent"
        },
        {
          quote: "The personalized attention from the faculty, the robotics lab, and the disciplined hostel environment are second to none in West Africa. It is the best investment we made for our sons.",
          author: "Engr. Farouk Bello, FNSE",
          designation: "Managing Director, Kaduna Refining & Petrochemicals"
        },
        {
          quote: "Salamah taught me that true intellect is grounded in service and moral responsibility. The mentorship from our Principal guided my successful admission to MIT.",
          author: "Mustapha Sani",
          designation: "Salamah Alumnus (Class of 2024), MIT Freshman"
        }
      ]
    }
  },
  {
    section_key: "contact",
    title: "Begin Your Child's Journey at Salamah",
    subtitle: "Our Admissions Directorate is delighted to schedule your private school consultation.",
    content: {
      email: "admissions@salamah.edu.ng",
      phone1: "+234 (0) 9 461 8000",
      phone2: "+234 (0) 803 123 4567",
      address: "Plot 1042 Diplomatic Zone, Maitama Extension, Abuja, FCT, Nigeria",
      officeHours: "Monday – Friday: 07:30 AM – 04:30 PM | Saturday: 09:00 AM – 01:00 PM (By Appointment)",
      accreditations: [
        "Cambridge International School (NG482)",
        "Federal Ministry of Education Accredited",
        "WAEC & NECO Examination Centre"
      ]
    }
  }
];

for (const sec of allSections) {
  await sql.query(
    `INSERT INTO cms_sections (section_key, title, subtitle, content, is_active, updated_at)
     VALUES ($1, $2, $3, $4, true, now())
     ON CONFLICT (section_key) DO UPDATE
     SET title = excluded.title, subtitle = excluded.subtitle, content = excluded.content, is_active = true, updated_at = now()`,
    [sec.section_key, sec.title, sec.subtitle, JSON.stringify(sec.content)]
  );
  console.log(`Seeded CMS section: ${sec.section_key}`);
}

console.log("All CMS sections successfully seeded into Neon DB!");
