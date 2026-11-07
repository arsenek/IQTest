import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 md:px-8 md:py-16">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-500">合规说明</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            免责声明
          </h1>
        </div>

        <article className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 text-base leading-relaxed text-zinc-700 md:p-8 md:text-lg">
          <p>
            IQTest
            采用<strong className="font-semibold text-zinc-900">自研题库与常模（试运行）</strong>
            ，测评结构对齐韦氏第四版四指数（言语理解、知觉推理、工作记忆、加工速度）。
          </p>
          <p>
            本站<strong className="font-semibold text-zinc-900">不是</strong>
            官方韦氏、WISC 或 WAIS
            产品，不提供官方手册、题目或常模的数字化复刻，也不构成对任何商标权利人的关联或背书。
          </p>
          <p>
            本站输出的合成分、指数分与解读文案<strong className="font-semibold text-zinc-900">
              仅供参考与自我了解
            </strong>
            ，不能替代专业心理评估、医学诊断、特殊教育鉴定或升学录取决定。如有相关需求，请咨询持证专业人士。
          </p>
          <p>
            儿童用户建议在家长陪同下使用。练习室进度与正式测评分隔离，练习结果不会回写正式报告分数。
          </p>
          <p className="text-sm text-zinc-500">
            内容与软件版权归本站运营方所有；未经许可不得擅自复制题库用于商业或临床用途。
          </p>
        </article>

        <Link
          href="/"
          className="text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          返回首页
        </Link>
      </main>
    </div>
  );
}
