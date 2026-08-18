// Long-form legal copy for the Privacy Policy and Terms / Community Guidelines.
//
// IMPORTANT: This is a first-version template, not vetted legal advice. Have a
// qualified lawyer review it for your target markets before you rely on it.
//
// Legal prose lives here as editable content blocks (per locale) rather than as
// dozens of tiny i18n keys — that keeps multi-paragraph documents maintainable.
// UI chrome (page title, nav, back button) still goes through t().

export type LegalDocId = "privacy" | "terms";
export type LegalLocale = "zh" | "en";

export interface LegalSection {
  heading: string;
  /** Each entry is a paragraph. A leading "• " marks a bullet line. */
  body: string[];
}

export interface LegalDoc {
  title: string;
  /** Shown under the title. */
  updated: string;
  /** Non-advice disclaimer shown in a callout at the top. */
  disclaimer: string;
  sections: LegalSection[];
}

// Placeholder effective date — update before launch.
const EFFECTIVE = "2026-08-18";

const PRIVACY_ZH: LegalDoc = {
  title: "隐私政策",
  updated: `生效日期：${EFFECTIVE}`,
  disclaimer:
    "本文为第一版模板，非正式法律意见。正式上线前请由执业律师按你所在地区法律审阅。",
  sections: [
    {
      heading: "一、我们是谁、这份政策管什么",
      body: [
        "“无名信”是一个匿名信箱产品：访客无需登录即可匿名写信，箱主登录后收发信件。本政策说明我们收集哪些信息、如何使用、保存多久，以及你享有的权利。",
      ],
    },
    {
      heading: "二、关于发信人（访客）的信息",
      body: [
        "我们不采集、不要求、也不展示发信人的账号或真实身份。你匿名写下的信件内容会发送给对应箱主。",
        "为防止刷屏、骚扰等滥用行为，我们会在你发送信件时对你的网络地址（IP）进行处理：IP 与操作类型、服务端密钥一起经过单向哈希，仅保存这一段不可反查的技术标识，用于限流计数。",
        "• 我们不存储你的原始 IP；",
        "• 我们不提供、也不打算提供任何“查发信人身份”的功能；",
        "• 该哈希标识仅用于防滥用，并会在留存期限到期后自动清除。",
        "需要如实说明：这意味着本服务是“不采集也不展示发信人身份”，而非“完全零采集”。请勿据此认为可以匿名从事违法或侵权行为。",
      ],
    },
    {
      heading: "三、关于箱主的信息",
      body: [
        "箱主通过登录使用本服务。我们会处理与账号相关的信息（如账号标识、邮箱等）用于身份识别、收发信件与提供服务。",
        "箱主收到的信件、回复及对话记录会保存在我们的服务中，以便箱主查看与管理。",
      ],
    },
    {
      heading: "四、数据的保存与删除",
      body: [
        "信件与对话：由箱主管理。箱主删除某封信时，该信及其对话轮次会被一并删除。",
        "防滥用技术标识（哈希）：仅短期保存，到期自动清除，不长期留存。",
        "账号数据：你可以请求删除账号及与之关联的全部数据。",
        "已被删除的公开信件将在产品内断开访问链接；但你自行截图或转发到站外的内容，我们无法回收。",
      ],
    },
    {
      heading: "五、公开上墙",
      body: [
        "箱主可以选择将某封信“公开上墙”。一旦公开，该内容将对更多人可见，属于公开传播行为。请箱主在公开前审慎判断内容是否涉及他人隐私、名誉或其他权利。",
      ],
    },
    {
      heading: "六、你的权利",
      body: [
        "在适用法律范围内，你可以就与你有关的个人信息行使访问、更正、删除等权利。行使方式与投诉渠道见文末联系方式。",
      ],
    },
    {
      heading: "七、未成年人",
      body: [
        "本服务不面向低于最低使用年龄的用户。若你未达到所在地区的最低使用年龄，请勿使用本服务。若我们发现相关内容涉及未成年人且可能造成伤害，将优先处置。",
      ],
    },
    {
      heading: "八、联系与投诉",
      body: [
        "如需行使权利、举报有害内容或提出投诉，请通过产品内的举报入口，或联系我们（请在此填写你的联系邮箱/渠道）。",
      ],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy Policy",
  updated: `Effective date: ${EFFECTIVE}`,
  disclaimer:
    "This is a first-version template, not formal legal advice. Have a qualified lawyer review it for your jurisdictions before launch.",
  sections: [
    {
      heading: "1. Who we are & what this covers",
      body: [
        "Nameless Letters is an anonymous mailbox: visitors write letters anonymously without signing in, and owners sign in to receive and reply. This policy explains what we collect, how we use it, how long we keep it, and your rights.",
      ],
    },
    {
      heading: "2. Information about senders (visitors)",
      body: [
        "We do not collect, require, or display a sender's account or real-world identity. The letter you write anonymously is delivered to the relevant owner.",
        "To prevent flooding, harassment and other abuse, we process your network address (IP) when you send a letter: the IP is combined with the action type and a server-side secret and passed through a one-way hash. We keep only that non-reversible technical token, used for rate-limit counting.",
        "• We do not store your raw IP;",
        "• We do not offer, and do not intend to build, any feature to look up a sender's identity;",
        "• This hashed token is used only for anti-abuse and is deleted automatically after its retention period.",
        "To be accurate: this means we “do not collect or display sender identity”, not that we collect nothing at all. Do not treat anonymity as a license for unlawful or infringing conduct.",
      ],
    },
    {
      heading: "3. Information about owners",
      body: [
        "Owners use the service by signing in. We process account-related information (such as an account identifier and email) to identify you, deliver letters, and provide the service.",
        "Letters, replies and conversation history received by an owner are stored so the owner can view and manage them.",
      ],
    },
    {
      heading: "4. Retention & deletion",
      body: [
        "Letters & conversations: managed by the owner. Deleting a letter also deletes its conversation turns.",
        "Anti-abuse token (hashed): kept only briefly and deleted automatically on expiry; not retained long-term.",
        "Account data: you may request deletion of your account and all associated data.",
        "A deleted public letter is unlinked within the product; content you screenshot or share off-platform cannot be recalled by us.",
      ],
    },
    {
      heading: "5. Public wall",
      body: [
        "An owner may choose to publish a letter to the public wall. Once public, the content is visible to more people and constitutes public dissemination. Owners should judge carefully whether the content touches others' privacy, reputation or other rights before publishing.",
      ],
    },
    {
      heading: "6. Your rights",
      body: [
        "Subject to applicable law, you may exercise rights of access, correction and deletion over personal information relating to you. See the contact section for how to exercise them or file a complaint.",
      ],
    },
    {
      heading: "7. Minors",
      body: [
        "The service is not directed to users below the minimum age of use. If you are under the minimum age in your region, do not use the service. Where content involves minors and may cause harm, we prioritise its handling.",
      ],
    },
    {
      heading: "8. Contact & complaints",
      body: [
        "To exercise your rights, report harmful content, or file a complaint, use the in-product report entry or contact us (insert your contact email/channel here).",
      ],
    },
  ],
};

const TERMS_ZH: LegalDoc = {
  title: "用户协议与社区公约",
  updated: `生效日期：${EFFECTIVE}`,
  disclaimer:
    "本文为第一版模板，非正式法律意见。正式上线前请由执业律师按你所在地区法律审阅。",
  sections: [
    {
      heading: "一、接受条款",
      body: [
        "使用“无名信”即表示你已阅读并同意本协议与社区公约。若不同意，请勿使用本服务。",
      ],
    },
    {
      heading: "二、最低使用年龄",
      body: [
        "本服务面向达到所在地区最低使用年龄的用户（如适用为 13 岁 / 16 岁及以上）。未达该年龄者请勿使用。",
      ],
    },
    {
      heading: "三、内容规范（社区公约）",
      body: [
        "无论匿名与否，你都需对自己发布的内容负责。禁止发布以下内容：",
        "• 诽谤、侮辱、人身攻击；",
        "• 曝光他人隐私、人肉搜索（如真实姓名、住址、电话、照片等）；",
        "• 骚扰、威胁、恐吓或网络霸凌；",
        "• 鼓励自我伤害或自杀；",
        "• 违法信息，或涉及未成年人的有害内容；",
        "• 垃圾刷屏、诈骗或其他滥用行为。",
      ],
    },
    {
      heading: "四、匿名不等于免责",
      body: [
        "本服务提供匿名书写体验，但匿名不免除你依法应承担的责任。若发布内容违法或侵权，相关法律责任由发布者承担。",
      ],
    },
    {
      heading: "五、内容处置与举报",
      body: [
        "我们提供关键词初筛（非 AI 审核）、访客举报、单条封口、紧急关箱与删除等机制。收到举报或发现违规内容时，我们可自行判断删除内容、关闭信箱或限制相关账号。",
        "若你是被侵权的第三方（如被诽谤、被曝光隐私），可通过举报入口或联系我们提交下架请求。",
      ],
    },
    {
      heading: "六、公开上墙",
      body: [
        "箱主选择公开某封信即为公开传播该内容，须对由此产生的影响负责，并应事先判断是否涉及他人权利。",
      ],
    },
    {
      heading: "七、服务变更与终止",
      body: [
        "我们可能因合规、安全或运营需要调整、暂停或终止部分或全部服务，并尽力提前告知。",
      ],
    },
    {
      heading: "八、联系我们",
      body: [
        "如有疑问、举报或投诉，请通过产品内举报入口或联系我们（请在此填写你的联系邮箱/渠道）。",
      ],
    },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms & Community Guidelines",
  updated: `Effective date: ${EFFECTIVE}`,
  disclaimer:
    "This is a first-version template, not formal legal advice. Have a qualified lawyer review it for your jurisdictions before launch.",
  sections: [
    {
      heading: "1. Acceptance",
      body: [
        "By using Nameless Letters you confirm you have read and agree to these Terms and the Community Guidelines. If you do not agree, do not use the service.",
      ],
    },
    {
      heading: "2. Minimum age",
      body: [
        "The service is for users who meet the minimum age of use in their region (e.g. 13+ / 16+ where applicable). Do not use it if you are under that age.",
      ],
    },
    {
      heading: "3. Content rules (Community Guidelines)",
      body: [
        "Anonymous or not, you are responsible for what you post. The following are prohibited:",
        "• Defamation, insults, or personal attacks;",
        "• Exposing others' private information or doxxing (real names, addresses, phone numbers, photos, etc.);",
        "• Harassment, threats, intimidation, or cyberbullying;",
        "• Encouraging self-harm or suicide;",
        "• Unlawful content, or harmful content involving minors;",
        "• Spam/flooding, fraud, or other abuse.",
      ],
    },
    {
      heading: "4. Anonymity is not immunity",
      body: [
        "The service offers an anonymous writing experience, but anonymity does not relieve you of legal responsibility. If content is unlawful or infringing, the poster bears the resulting legal liability.",
      ],
    },
    {
      heading: "5. Moderation & reporting",
      body: [
        "We provide keyword pre-screening (not AI review), visitor reporting, single-thread muting, emergency inbox close, and deletion. On receiving a report or finding violations, we may remove content, close an inbox, or restrict accounts at our discretion.",
        "If you are an affected third party (e.g. defamed or exposed), you may submit a takedown request via the report entry or by contacting us.",
      ],
    },
    {
      heading: "6. Public wall",
      body: [
        "Choosing to publish a letter to the public wall is public dissemination; the owner is responsible for the consequences and should first assess whether it touches others' rights.",
      ],
    },
    {
      heading: "7. Changes & termination",
      body: [
        "We may modify, suspend, or terminate part or all of the service for compliance, safety, or operational reasons, and will make reasonable efforts to give notice.",
      ],
    },
    {
      heading: "8. Contact",
      body: [
        "For questions, reports, or complaints, use the in-product report entry or contact us (insert your contact email/channel here).",
      ],
    },
  ],
};

const DOCS: Record<LegalDocId, Record<LegalLocale, LegalDoc>> = {
  privacy: { zh: PRIVACY_ZH, en: PRIVACY_EN },
  terms: { zh: TERMS_ZH, en: TERMS_EN },
};

export function getLegalDoc(id: LegalDocId, locale: LegalLocale): LegalDoc {
  return DOCS[id][locale];
}
