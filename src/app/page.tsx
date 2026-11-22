import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";

const INDICES = [
  {
    title: "言语理解",
    body: "用词语理解概念、关系和表达，衡量语言相关的推理与知识运用。",
  },
  {
    title: "知觉推理",
    body: "通过图形与空间材料完成推理，观察视觉组织与问题解决。",
  },
  {
    title: "工作记忆",
    body: "在短时内保持并操作信息，反映注意与心理操作容量。",
  },
  {
    title: "加工速度",
    body: "在规定时间内完成简单视觉任务，体现处理效率与专注。",
  },
] as const;

const STEPS = [
  {
    title: "建档",
    body: "注册账号后创建儿童或成人档案；未满 16 岁为儿童测评体验。",
  },
  {
    title: "测评",
    body: "约 40–60 分钟标准测；中途可暂停，下次从断点继续。",
  },
  {
    title: "报告",
    body: "完成后查看四指数与总合成分，了解相对强弱。",
  },
  {
    title: "练习",
    body: "可对薄弱指数进入练习室巩固；练习不会回写正式分。",
  },
] as const;

export default async function Home() {
  const user = await getSessionUser();

  return (
    <div className="home-landing">
      <section className="home-hero" aria-labelledby="home-brand">
        <div className="home-hero-inner">
          <h1 id="home-brand" className="home-brand">
            IQTest
          </h1>
          <p className="home-lead">
            结构对齐四指数的中文认知测评；约 40–60 分钟，测完看报告，可对薄弱项练习。
          </p>
          <div className="home-cta-group">
            {user ? (
              <Link
                href="/profiles"
                className="home-cta-primary"
                data-testid="home-cta-primary"
              >
                进入我的档案
              </Link>
            ) : (
              <>
                <Link
                  href="/register?next=/profiles"
                  className="home-cta-primary"
                  data-testid="home-cta-primary"
                >
                  开始测评
                </Link>
                <Link
                  href="/login?next=/profiles"
                  className="home-cta-secondary"
                  data-testid="home-cta-login"
                >
                  登录
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section
        className="home-section"
        aria-labelledby="home-indices"
        id="indices"
      >
        <div className="home-section-inner">
          <h2 id="home-indices">测什么</h2>
          <p className="home-section-lead">
            结构对齐韦氏四指数：言语理解、知觉推理、工作记忆、加工速度。
          </p>
          <dl className="home-indices">
            {INDICES.map((item) => (
              <div key={item.title} className="home-index">
                <dt>{item.title}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        className="home-section"
        aria-labelledby="home-howto"
        id="howto"
      >
        <div className="home-section-inner">
          <h2 id="home-howto">怎么用</h2>
          <p className="home-section-lead">
            先建档再测评；未登录「开始测评」会进入注册，成功后到档案中心。
          </p>
          <ol className="home-steps">
            {STEPS.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="home-foot">
        <div className="home-section-inner">
          <p>
            试运行 · 自研题库 · 结构对齐四指数。结果仅供参考，不能替代专业心理或医学评估。
            儿童请在家长陪同下使用。详阅{" "}
            <Link href="/legal/disclaimer">免责声明</Link>。
          </p>
        </div>
      </footer>
    </div>
  );
}
