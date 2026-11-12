import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useDb } from "../lib/hooks";
import { useSeo } from "../lib/seo";

const UPDATED = "10 November 2026";

export function Privacy() {
  const db = useDb();
  useSeo({ title: "Privacy notice", description: "How KR8 Academy uses application and learning information.", path: "/privacy" });

  return (
    <article className="shell py-12 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Link to="/apply" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"><ArrowLeft size={15} /> Back to application</Link>
        <p className="eyebrow mt-8">Your information</p>
        <h1 className="display display-lg mt-4">Privacy, in plain language.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">Last updated {UPDATED}. KR8 Academy, operated by KR8 Digitals with Next Gen Scholars for exam preparation, uses the information you choose to provide to review applications and support learning.</p>

        <div className="mt-8 rounded-2xl border border-warn/30 bg-warn/8 p-4 text-sm leading-relaxed text-body">
          <strong className="text-ink">Preview note.</strong> This evaluation build is not a secure production records service and does not synchronize accounts or applications across devices. Please do not submit sensitive or confidential information here.
        </div>

        <div className="mt-8 space-y-7">
          <section>
            <h2 className="display display-md">What you may share</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Application forms may ask for your name, contact details, date of birth, location, education, device access, learning interests, exam goals and consent choices. If you create a learner account, activity such as attendance, assignments and progress may also be recorded.</p>
          </section>
          <section>
            <h2 className="display display-md">Why we use it</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
              <li>To assess and administer applications, waitlists and cohort participation.</li>
              <li>To create and manage a learner profile, KR8 ID, progress record and credentials.</li>
              <li>To contact you about your application and programme when you have asked us to do so.</li>
              <li>To protect the integrity of learning records and verify credentials when a graduate chooses to share them.</li>
            </ul>
          </section>
          <section>
            <h2 className="display display-md">Your choices and rights</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Optional communications are separate from the messages needed to respond to an application. You may ask to access, correct or delete information you provided, or withdraw from optional communications. Some credential-verification details may need to remain available to prevent fraudulent claims.</p>
          </section>
          <section>
            <h2 className="display display-md">Sharing and safeguards</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">KR8 does not sell applicant information. We only share details with programme staff and delivery partners when needed to administer the pathway you selected, or when required by law. Do not share passwords or verification codes with anyone.</p>
          </section>
          <section>
            <h2 className="display display-md">Contact</h2>
            <a href={`mailto:${db.settings.supportEmail}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-magenta-bright hover:underline"><Mail size={15} /> {db.settings.supportEmail}</a>
          </section>
        </div>
        <div className="mt-10 flex items-center gap-2 border-t border-line pt-5 text-xs text-muted"><ShieldCheck size={15} className="text-live" /> Your trust matters more than an application.</div>
      </div>
    </article>
  );
}

export function Terms() {
  useSeo({ title: "Academy terms", description: "Participation expectations for KR8 Academy learners.", path: "/terms" });
  return (
    <article className="shell py-12 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Link to="/apply" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"><ArrowLeft size={15} /> Back to application</Link>
        <p className="eyebrow mt-8">Participation</p>
        <h1 className="display display-lg mt-4">A few things we ask of each other.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">Last updated {UPDATED}. KR8 Academy is tuition-free. By applying, you agree to provide accurate information, treat learners and mentors respectfully, follow programme guidance, and submit work that is yours or properly attributed.</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
          <section><h2 className="display display-md">Learning and conduct</h2><p className="mt-3">Admission depends on programme capacity and eligibility. Participation may require regular attendance, assignments and respectful conduct. KR8 may pause access for serious misconduct, harassment, fraud or repeated disruption, with a fair opportunity to clarify concerns.</p></section>
          <section><h2 className="display display-md">Work and credentials</h2><p className="mt-3">You keep ownership of your original work. You give KR8 permission to review it for teaching and assessment. We will ask before using identifiable learner work or a testimonial in public promotion. Certificates are awarded only when published programme criteria are met; a KR8 ID or certificate is not a guarantee of employment or exam results.</p></section>
          <section><h2 className="display display-md">Costs and availability</h2><p className="mt-3">There is no tuition charge for the Academy programme. Any optional third-party service, device, connectivity or data cost is your responsibility. Timetables and programme content may change; material changes will be communicated through the contact details you provided.</p></section>
          <section><h2 className="display display-md">Questions</h2><p className="mt-3">For help or to raise a concern, contact <a className="font-semibold text-magenta-bright hover:underline" href="mailto:academy@kr8digitals.com">academy@kr8digitals.com</a>.</p></section>
        </div>
      </div>
    </article>
  );
}
