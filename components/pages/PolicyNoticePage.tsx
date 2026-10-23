import ContentPage from "@/components/pages/ContentPage";

type PolicyNoticePageProps = {
  title: string;
  intro: string;
  topics: string;
};

export default function PolicyNoticePage({
  title,
  intro,
  topics,
}: PolicyNoticePageProps) {
  return (
    <ContentPage eyebrow="IndianTTS policies" title={title} intro={intro}>
      <section
        aria-labelledby="policy-status"
        className="rounded-xl border border-orange-200 bg-orange-50 p-5"
      >
        <h2 id="policy-status" className="font-semibold text-slate-950">
          Policy details are not published here yet
        </h2>
        <p className="mt-2 text-slate-700">
          This page does not establish {topics}. Please check for a complete,
          reviewed policy before relying on terms in this area.
        </p>
      </section>
    </ContentPage>
  );
}