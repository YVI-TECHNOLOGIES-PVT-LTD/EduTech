# EduTrack ERP — Dynamic Multi-Language Translation Architecture

## 1. Overview & Universal Runtime Architecture

EduTrack ERP employs a production-grade, dynamic multi-language translation architecture designed to eliminate the maintenance overhead of monolithic, static translation JSON files. 

Developers write natural English UI strings directly across components. The **Universal Translation Runtime (`AutoTranslator` + `DomTranslationRuntime`)** automatically observes rendered UI text nodes, placeholders, tooltips, and accessibility labels, coordinating a controlled domain glossary, multi-tiered caching, request deduplication, value protection, and an optional self-hosted LibreTranslate backend.

```text
                         EduTrack React UI
                               │
                               ▼
                       LanguageProvider
                               │
                               ▼
                        AutoTranslator
                               │
                               ▼
                     DomTranslationRuntime
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       Initial/Route Sweep              MutationObserver
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                      Content Classifier
              (Plausible UI String vs Data/IDs)
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
         Protected          Glossary        Translatable
        (APP-XXXX,             │                 │
        UUIDs, SVG)            │                 ▼
             │                 │       50ms Debounced Queue
             │                 │                 │
             │                 │                 ▼
             │                 │        TranslationManager
             │                 │                 │
             │                 │        ┌────────┼────────┐
             │                 │        │        │        │
             │                 │       L1       L2      API
             │                 │      Cache    Cache   Service
             │                 │        │        │        │
             └─────────────────┴────────┴────────┴────────┘
                                      │
                                      ▼
                              Translated UI Text
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                       LTR                       RTL text
                    en/te/hi/ta/kn/ml              │
                                               ar / ur
```

---

## 2. Supported Languages

EduTrack supports 8 primary languages:

| Code | Language | Native Name | Locale | Text Direction | Shell Direction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `en` | English | English | `en-IN` | **LTR** | **LTR** |
| `te` | Telugu | తెలుగు | `te-IN` | **LTR** | **LTR** |
| `hi` | Hindi | हिन्दी | `hi-IN` | **LTR** | **LTR** |
| `ta` | Tamil | தமிழ் | `ta-IN` | **LTR** | **LTR** |
| `kn` | Kannada | ಕನ್ನಡ | `kn-IN` | **LTR** | **LTR** |
| `ml` | Malayalam | മലയാളം | `ml-IN` | **LTR** | **LTR** |
| `ur` | Urdu | اردو | `ur-PK` | **RTL (Text Only)** | **LTR** |
| `ar` | Arabic | العربية | `ar-SA` | **RTL (Text Only)** | **LTR** |

---

## 3. Strict LTR Shell & Localized Text-Level RTL

A core architectural invariant of EduTrack is **Strict LTR Shell Placement**:

1. **Global Shell Layout**:
   - `document.documentElement.dir = "ltr"` is permanently preserved.
   - The application layout is **never mirrored** when switching to Arabic or Urdu.
   - The left sidebar remains on the **LEFT**.
   - The navbar, command palette, user dropdown, charts, data tables, and navigation icons retain their standard orientations and geometry.

2. **Localized RTL Text Content**:
   - For Arabic (`ar`) and Urdu (`ur`) textual elements, localized text containers use:
     ```css
     .rtl-text, [dir="rtl"] {
       direction: rtl;
       unicode-bidi: plaintext;
       text-align: start;
     }
     ```
   - Technical codes, student/applicant IDs, receipt numbers, and monetary figures are protected with LTR isolation:
     ```css
     .font-mono, .ltr-isolate, [data-ltr="true"] {
       direction: ltr;
       unicode-bidi: isolate;
       text-align: start;
     }
     ```

---

## 4. Controlled Terminology Glossary

Critical EduTrack domain terms are managed inside [`TranslationGlossary.ts`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/services/translation/TranslationGlossary.ts). This ensures zero-latency, 100% consistent translations for core workflows:

- **Core Actions**: *Save Changes, Cancel, Submit, Edit, Delete, View, Search, Filter, Reset, Export, Refresh, Notifications, Profile, Settings, Logout.*
- **Admissions Lifecycle**: *Admission, Admissions, Application, Applications, Application Number, Document Verification, Fee Collection, Fees & Payments, Campus Visits, Campus Visits & Interviews, Entrance Exams, Enquiries & Leads, Lead, Student, Students, Parent, Guardian, Counsellor, Academic Year, Parent Portal, My Applications, Front Office Leads & Inquiries, Command Center, Operations Workspace.*
- **KPI Metrics & Filters**: *TOTAL INQUIRIES, HOT PRIORITY, QUALIFIED LEADS, VISITS & SESSIONS, All Stages, All Priority, All Grades, All Counsellors.*
- **Workflow Statuses**: *Pending, Approved, Rejected, Submitted, Under Review, Enrolled, Withdrawn, Active, Inactive, Completed, In Progress, Draft, Hot, Warm, Cold.*

---

## 5. React-Safe Controlled Discovery & Loop Prevention

The [`DomTranslationRuntime`](file:///c:/Users/DELL/Desktop/EduTech/apps/web_app/src/services/translation/DomTranslationRuntime.ts) resolves the classic challenges of runtime DOM translation:

1. **WeakMap Canonical Storage**:
   - `canonicalTextMap` (`WeakMap<Node, string>`) stores the pristine canonical English string when a node is first encountered.
   - `canonicalAttrMap` (`WeakMap<Element, Map<string, string>>`) stores pristine attribute values (`placeholder`, `aria-label`, `title`, `alt`).
   - Zero DOM pollution with custom dataset attributes.
2. **Loop Prevention Guard**:
   - Uses an internal `WeakSet<Node>` ignore set so that text mutations executed by the translation runtime do not re-trigger `MutationObserver` callbacks.
3. **50 ms Debounced Batch Queue**:
   - Discovered translatable strings are queued and processed in a 50ms debounced batch via `TranslationManager.translateBatch()`.
4. **Pristine English Baseline for Bi-directional Switching**:
   - Switching `English → Telugu → Arabic → Urdu → Hindi → English` always resolves from the pristine `WeakMap` canonical English source, completely eliminating compounding translation degradation.

---

## 6. Content Classification & Semantic Protection

### Translatable Content
- Visible natural-language text nodes in buttons, headers, sidebars, navbars, KPI labels, filter dropdowns, table headers, descriptions, empty states, error badges.
- Attributes: `placeholder`, `aria-label`, `title`, `alt`.
- SVG `<text>` elements in chart axes, tooltips, and legends.

### Protected Non-Translatable Content
- **Application & Lead IDs**: `APP-2026-00369`, `LEAD-2026-00587`, `ENQ-XXXX`, `STU-XXXX`, `UTR-XXXX`, `REC-XXXX`, `TRX-XXXX`
- **UUIDs**: `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-...`
- **Email Addresses & Phone Numbers**
- **URLs & API Endpoints**
- **Pure Numbers & Currency Values**: `₹ 25,000`, `$ 100`, `12345`, `100%`, `+12.5%`
- **Active Form Input Values**: (`<input>`, `<textarea>` user typing values are untouched; only `placeholder` is translated).
- **SVG Geometry**: (`<path>`, `<rect>`, `<circle>`, `<line>`, `<polygon>`, `<g>`, `<clipPath>`).
- **Semantic Escape Hatches**:
  - `translate="no"` or `data-no-translate="true"`
  - `data-ltr="true"`
  - `.font-mono` or `.ltr-isolate` or `.notranslate`
  - Explicit opt-in: `data-translate="yes"`

---

## 7. LibreTranslate Configuration & Hard Failure Boundary

To enable dynamic translation for strings outside the controlled glossary, configure a self-hosted instance of [LibreTranslate](https://libretranslate.com/):

### Environment Variables
```env
# URL of your self-hosted LibreTranslate instance
VITE_TRANSLATION_API_URL=https://translate.your-school-domain.com

# Optional API Key (if your instance requires authentication)
VITE_TRANSLATION_API_KEY=
```

### Self-Hosting with Docker
```bash
docker run -d -p 5000:5000 \
  --name edutrack-translator \
  libretranslate/libretranslate \
  --load-only en,te,hi,ta,kn,ml,ur,ar \
  --update-models
```

### Hard Failure Boundary
If LibreTranslate is unconfigured, offline, or returns an error:
```text
Translation API unavailable
        ↓
Glossary match?
        ↓
YES → Use glossary translation
NO  → Retain pristine English source
```
- Never blanks the text
- Never displays `undefined` or `[translation failed]`
- Never blocks or crashes the UI

---

## 8. Usage in React Components

### Universal Automatic Translation (Default)
Developers write standard, clean English JSX:
```tsx
export const DashboardHeader: React.FC = () => {
  return (
    <div>
      <h1>Front Office Leads & Inquiries</h1>
      <p>Manage prospective student leads and admission inquiries</p>
      <input placeholder="Search student, lead #, guardian..." />
      <button>Create New Lead</button>
    </div>
  );
};
```
The runtime automatically discovers, classifies, and translates all eligible text and placeholders across all 8 languages without manual wrapping.

### Semantic Protection Example
```tsx
{/* Technical ID: Protected from translation and isolated LTR */}
<span className="font-mono ltr-isolate">{lead.lead_number}</span>

{/* User Name: Protected from machine translation */}
<span translate="no">{student.name}</span>
```
