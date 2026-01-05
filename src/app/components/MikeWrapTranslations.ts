// Bilingual translations for Mike Wrap Screen8 user types

export const getUserTypeContent = (mike_type: number, language: 'en' | 'zh') => {
  const translations = {
    1: {
      en: {
        title: "Community\nConnector",
        description: "You grow faster when you learn with others.",
        subtitle: "Perspective is your real advantage."
      },
      zh: {
        title: "社群\n连接者",
        description: "与他人一起学习，你会成长得更快",
        subtitle: "多元视角是你的真正优势"
      }
    },
    2: {
      en: {
        title: "Signal\nHunter",
        description: "You move when timing matters.",
        subtitle: "Signals guide your decisions."
      },
      zh: {
        title: "信号\n捕手",
        description: "当时机重要时，你会采取行动",
        subtitle: "信号引导你的决策"
      }
    },
    3: {
      en: {
        title: "Insight\nCollector",
        description: "You look for the 'why' behind every move.",
        subtitle: "Understanding comes before action."
      },
      zh: {
        title: "洞察\n收集者",
        description: "你寻找每个动作背后的「为什么」",
        subtitle: "理解先于行动"
      }
    },
    4: {
      en: {
        title: "System\nCrafter",
        description: "You turn ideas into repeatable decisions.",
        subtitle: "Process keeps you sharp."
      },
      zh: {
        title: "系统\n构建者",
        description: "你将想法转化为可重复的决策",
        subtitle: "流程让你保持敏锐"
      }
    }
  };

  const typeContent = translations[mike_type as keyof typeof translations] || translations[1];
  return typeContent[language];
};
