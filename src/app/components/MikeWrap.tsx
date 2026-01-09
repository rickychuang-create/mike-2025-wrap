import svgPaths from "../../imports/svg-3vt1zivl9b";
import { useState, createContext, useContext, useRef, useEffect, ReactNode } from "react";
import { toPng } from "html-to-image";
import imgLoginBackground from "../../assets/56b5c5268002dc2dc0d66c169166bd1b809f2baa.png";
import imgUserTypeBackground from "../../assets/9466ce84f3972cbe4812a57f95a8b27a5849e013.png";
import imgTopFunctionsBackground from "../../assets/d4a720df43c93a5bfb3b5c46a555a8a46169db5e.png";
import imgEvolutionBackground from "../../assets/0daf03c8cb905fd16c7b536a4d85f7c1bf293f1f.png";
import imgMikeTradeBackground from "../../assets/eb3f6061e5e4daec8146192551ab468a94cfbb68.png";
import imgActiveDaysBackground from "../../assets/2e5e3c0b2d1d3df6c5e419e0cb0f09ad18e7c95f.png";
import { Crown, Camera, ChevronRight, ChevronLeft, Gift, Clock, TrendingUp, Sparkles } from "lucide-react";
import imgChatRoom from "../../assets/130e47bc5599e981dd3764fa04f621aae6c9500f.png";
import imgMikeTrade from "../../assets/7b5e13d4c387d8ba7a5cf0ad5e8e632742979b1c.png";
import imgLiveRoom from "../../assets/8edafb93c55a63e088100ef79ef041df60a69b06.png";
import imgType1Zh from "../../assets/type1_zh.png";
import imgType1En from "../../assets/type1_en.png";
import imgType2Zh from "../../assets/type2_zh.png";
import imgType2En from "../../assets/type2_en.png";
import imgType3Zh from "../../assets/type3_zh.png";
import imgType3En from "../../assets/type3_en.png";
import imgType4Zh from "../../assets/type4_zh.png";
import imgType4En from "../../assets/type4_en.png";
import { recognizeAccount } from "../api/gemini";
import { getUserData, UserData, trackUserEvent } from "../api/sheets";

// --- 0. 全局 Context 與工具函數 ---

type Language = 'en' | 'zh';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'en',
  setLanguage: () => {},
});

function useLanguage() {
  return useContext(LanguageContext);
}

// 預設資料
const DEFAULT_WRAP_DATA = {
  days_with_mike: 232,
  active_days: 196,
  login_percentage: 84,
  active_days_level_grade: 5, 
};

function mapUserDataToWrapData(userData: UserData | null) {
  if (!userData) {
    return DEFAULT_WRAP_DATA;
  }
  return {
    days_with_mike: userData.days_with_mike,
    active_days: userData.active_days,
    login_percentage: userData.login_percentage,
    active_days_level_grade: userData.active_days_level,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('無法讀取檔案'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 輔助函數：帶有追蹤的跳轉
const navigateWithTrack = (url: string, eventName: string, account: string) => {
  // 1. 先送出事件
  // 即使 account 為空也嘗試發送，後端可能會紀錄 IP 或其他資訊
  trackUserEvent({ account: account || 'visitor', clicked_button: eventName });
  
  // 2. 稍微延遲跳轉，確保請求送出 (150ms 通常足夠)
  setTimeout(() => {
    window.open(url, '_blank');
  }, 150);
};

// --- 1. 新增組件：故事進度條 (StoryProgress) ---
function StoryProgress({ 
  total, 
  current, 
  onNavigate 
}: { 
  total: number; 
  current: number; 
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 pt-[12px] px-2 flex gap-1.5 h-[40px] pointer-events-auto">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onNavigate(index)}
          className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/30 relative group cursor-pointer transition-all hover:h-[4px]"
        >
          <div
            className={`absolute top-0 left-0 bottom-0 w-full bg-white transition-all duration-300 ${
              index < current ? 'translate-x-0' : 
              index === current ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
              opacity: index <= current ? 1 : 0
            }}
          />
        </button>
      ))}
    </div>
  );
}

// --- 2. 核心組件：響應式外框 (ResponsiveWrapper) ---
interface ResponsiveWrapperProps {
  children: ReactNode;
  scale: number;
  backgroundSrc?: string;
  backgroundOverlay?: ReactNode;
  backgroundColor?: string;
  className?: string;
}

function ResponsiveWrapper({ 
  children, 
  scale, 
  backgroundSrc, 
  backgroundOverlay,
  backgroundColor = "bg-[#5B16D6]",
  className = ""
}: ResponsiveWrapperProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${backgroundColor} ${className}`}>
      {/* 1. 背景層 */}
      {backgroundSrc && (
        <img 
          alt="" 
          src={backgroundSrc} 
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" 
        />
      )}
      
      {/* 額外的背景疊加層 */}
      {backgroundOverlay && (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {backgroundOverlay}
        </div>
      )}

      {/* 2. UI 容器層：置中，並根據 scale 縮放 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          style={{ 
            width: 390, 
            height: 844, 
            transform: `scale(${scale}) translateZ(0)`, // 新增: translateZ(0) 強制開啟 GPU 加速
            transformOrigin: 'center center', // 明確指定縮放原點
            willChange: 'transform', // 新增: 告訴瀏覽器此元素會變形，優化渲染
            backfaceVisibility: 'hidden', // 新增: 避免旋轉/縮放時的閃爍
            pointerEvents: 'auto' 
          }}
          className="relative shrink-0 shadow-2xl"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Screen 1: Login ---
function Screen1({
  onAccountRecognized,
  onSeeWrap,
  onLoadUserData,
  externalErrorMessage,
  uiScale
}: {
  onAccountRecognized?: (account: string) => void;
  onSeeWrap?: () => void;
  onLoadUserData?: (account: string) => Promise<boolean>;
  externalErrorMessage?: string | null;
  uiScale: number;
}) {
  const { language, setLanguage } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountInput, setAccountInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const displayErrorMessage = errorMessage || externalErrorMessage || null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(language === 'zh' ? '圖片大小超過 5MB，請上傳較小的圖片' : 'Image size exceeds 5MB');
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrorMessage(language === 'zh' ? '不支援的圖片格式' : 'Unsupported image format');
      return;
    }

    setErrorMessage(null);
    setIsRecognizing(true);

    try {
      const base64 = await fileToBase64(file);
      setUploadedImage(base64);
      const result = await recognizeAccount(base64);

      if (result.status === 'ok' && result.account_prefix) {
        setAccountInput(result.account_prefix);
        setUploadedImage(null);
        if (onAccountRecognized) onAccountRecognized(result.account_prefix);
      } else {
        const message = language === 'zh' 
          ? (result.user_message_zh || '辨識失敗，請稍後再試')
          : (result.user_message_en || result.user_message_zh || 'Recognition failed');
        setErrorMessage(message);
      }
    } catch (error) {
      setErrorMessage(language === 'zh' ? '系統忙碌中，請稍後再試' : 'System is busy');
    } finally {
      setIsRecognizing(false);
    }
  };
  
  return (
    <ResponsiveWrapper scale={uiScale} backgroundSrc={imgLoginBackground} data-name="Login">
      {/* Language Toggle */}
      <div className="absolute top-[60px] right-8 z-10">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xl border border-white/25 rounded-full p-1">
          <button onClick={() => setLanguage('zh')} className={`px-4 py-1.5 rounded-full font-['Inter','Noto_Sans_SC'] font-medium text-[13px] transition-all ${language === 'zh' ? 'bg-white text-[#5B16D6] shadow-lg' : 'text-white/70 hover:text-white'}`}>简中</button>
          <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-full font-['Inter','Noto_Sans_SC'] font-medium text-[13px] transition-all ${language === 'en' ? 'bg-white text-[#5B16D6] shadow-lg' : 'text-white/70 hover:text-white'}`}>EN</button>
        </div>
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
        <div className="w-full max-w-[300px] space-y-8">
          <div className="space-y-4">
            <h1 className="font-['Inter','Noto_Sans_SC'] font-black text-white text-[56px] leading-[0.95] tracking-[-0.02em] uppercase">
              {language === 'zh' ? '你的\n2025' : 'Your\n2025'}
            </h1>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[15px] leading-[1.5]">
              {language === 'zh' ? '一起回顾你与麦克的旅程' : "Let's recap your journey with Mike"}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-clip">
              <div className="px-5 py-4">
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[13px] mb-1">{language === 'zh' ? '账户' : 'Account'}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={accountInput}
                    onChange={(e) => setAccountInput(e.target.value)}
                    placeholder="example123@gmail.com"
                    className="flex-1 bg-transparent font-['Inter','Noto_Sans_SC'] font-medium text-white text-[15px] outline-none placeholder:text-white/40"
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Camera className="size-5 text-white/60" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
                {isRecognizing && (
                  <div className="mt-2 flex items-center gap-2 text-white/70 text-[13px]">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <span>{language === 'zh' ? '辨識中...' : 'Recognizing...'}</span>
                  </div>
                )}
                {displayErrorMessage && (
                  <p className="mt-2 text-[#FF8F8F] text-[13px] font-medium leading-tight animate-in fade-in slide-in-from-top-1">
                    {displayErrorMessage}
                  </p>
                )}
                {uploadedImage && !isRecognizing && <div className="mt-3"><img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg" /></div>}
              </div>
            </div>
            
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/60 text-[13px] leading-[1.5]">
              {language === 'zh' 
                ? <>
                    请输入你登录 Mike App 使用的账号（@ 前的部分），或上传
                    <span 
                      onClick={() => navigateWithTrack('https://www.cmoney.tw/r/236/np8nqw', 'screen1_more_link', accountInput || 'visitor')}
                      className="underline hover:text-white/80 transition-colors cursor-pointer mx-1"
                    >
                      「更多页」
                    </span>
                    的截图。
                  </>
                : <>
                    Enter the account you use to log in to Mike App (the part before @), or upload a screenshot of the 
                    <span 
                       onClick={() => navigateWithTrack('https://www.cmoney.tw/r/236/np8nqw', 'screen1_more_link', accountInput || 'visitor')}
                       className="underline hover:text-white/80 transition-colors cursor-pointer mx-1"
                    >
                      "More"
                    </span> 
                    page.
                  </>
              }
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={async () => {
                if (!accountInput.trim()) {
                  setErrorMessage(language === 'zh' ? '請輸入帳號或上傳截圖' : 'Please enter your account or upload a screenshot');
                  return;
                }
                
                setIsLoadingData(true);
                setErrorMessage(null);
                
                if (onLoadUserData) {
                  const success = await onLoadUserData(accountInput.trim());
                  if (!success) {
                    setErrorMessage(
                      language === 'zh' 
                        ? '找不到此帳號的資料，請確認帳號是否正確' 
                        : 'Account not found, please verify your account'
                    );
                  }
                }
                setIsLoadingData(false);
              }}
              disabled={isRecognizing || isLoadingData}
              className={`w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-2xl shadow-black/20 hover:bg-white/95 transition-all ${(isRecognizing || isLoadingData) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {(isRecognizing || isLoadingData) ? (language === 'zh' ? '載入中...' : 'Loading...') : (language === 'zh' ? '查看我的年度回顾' : 'See My Wrap')}
            </button>
            <button 
              onClick={() => {
                navigateWithTrack('https://www.cmoney.tw/r/236/np8nqw', 'screen1_back_to_mike_app', accountInput || 'visitor'); 
              }}
              className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-6 py-3 font-['Inter','Noto_Sans_SC'] font-semibold text-[15px] hover:bg-white/15 transition-all">
              {language === 'zh' ? '返回麦克APP' : 'Back to Mike App'}
            </button>
          </div>
        </div>
      </div>
    </ResponsiveWrapper>
  );
}

// --- Screen 2: Days Count ---
function Screen2({ userData, uiScale }: { userData: UserData | null; uiScale: number }) {
  const { language } = useLanguage();
  const wrapData = mapUserDataToWrapData(userData);
  const { days_with_mike } = wrapData;

  const overlay = (
    <>
      <img alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" src={imgEvolutionBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/25 via-transparent to-[#5B16D6]/15 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
    </>
  );

  return (
    <ResponsiveWrapper scale={uiScale} backgroundSrc={imgLoginBackground} backgroundOverlay={overlay} data-name="Welcome">
      
      {/* 標題 (保持原位) */}
      <div className="absolute top-[160px] left-0 right-0 px-10">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[18px] leading-[1.3] text-center">
          {language === 'zh' ? '与麦克同行的日子' : 'DAYS WITH MIKE'}
        </p>
      </div>

      {/* --- 修改處：數字 + 單位 --- */}
      {/* 改用 Flex 佈局，並設定 items-baseline 讓底部對齊 */}
      <div className="absolute top-[300px] left-0 right-0 flex justify-center items-baseline gap-3">
        <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[140px] leading-[0.85] tracking-[-0.04em]">
          {days_with_mike}
        </h1>
        <span className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[32px]">
           {language === 'zh' ? '天' : 'Days'}
        </span>
      </div>

      {/* 底部文字 (保持原位) */}
      <div className="absolute bottom-[180px] left-0 right-0 px-10">
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/60 text-[15px] leading-[1.5] text-center">
          {language === 'zh'
            ? '感谢你在 2025 与 Mike 并肩，很高兴能见证你的每一次跃升'
            : 'Thank you for walking alongside Mike in 2025.\nWe\'re grateful to witness every step of your growth.'}
        </p>
      </div>
    </ResponsiveWrapper>
  );
}

// --- Screen 3: Active Days ---
function Screen3({ userData, uiScale }: { userData: UserData | null; uiScale: number }) {
  const { language } = useLanguage();
  const wrapData = mapUserDataToWrapData(userData);
  const { active_days, days_with_mike, active_days_level_grade } = wrapData;

  const overlay = (
    <>
      <img alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" src={imgUserTypeBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/30 via-transparent to-[#5B16D6]/20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </>
  );

  return (
    <ResponsiveWrapper scale={uiScale} backgroundColor="bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" backgroundOverlay={overlay} data-name="Days Logged">
      {/* 1. 標題區 (維持原位) */}
      <div className="absolute top-[100px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[16px] leading-[1.3] tracking-[0.05em] uppercase mb-3">
          {language === 'zh' ? '活跃天数' : 'Active Days'}
        </p>
        <div className="h-[1px] w-16 bg-white/40" />
      </div>
      
      {/* 2. 敘述文字區 (移到標題下方) */}
      <div className="absolute top-[200px] left-8 right-8 flex flex-col gap-1">
        {/* 第一句：在你与 Mike 同行的... */}
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[16px] leading-[1.5]">
          {language === 'zh' 
            ? `在你与 Mike 同行的 ${days_with_mike} 天里，` 
            : `In the ${days_with_mike} days walking with Mike,`}
        </p>
        {/* 第二句：你与 App 互动了 */}
        <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3]">
           {language === 'zh' 
             ? '你与 App 互动了' 
             : 'You engaged with the App for'}
        </p>
      </div>

      {/* 3. 核心數字區 (移到文字下方，並加上單位) */}
      <div className="absolute top-[320px] left-0 right-0 flex justify-center items-baseline gap-3 px-4">
        <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[160px] leading-[0.85] tracking-[-0.04em]">
          {active_days}
        </h1>
        <span className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[32px]">
          {language === 'zh' ? '天' : 'Days'}
        </span>
      </div>
      
      {/* 4. 底部文案區 (移除強制換行) */}
      <div className="absolute bottom-[70px] left-8 right-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
         {active_days_level_grade === 1 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3] mb-3">
              {language === 'zh' ? '你比 95% 的用户，更完整掌握 Mike 的第一手信息' : "You’re present at Mike’s perspective moments more often than 90% of users."}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[13px] leading-[1.6] whitespace-pre-line">
              {language === 'zh' 
                ? '你不是偶尔路过，而是长期站在 Mike 的判断轨道上。当市场变化出现时，你更容易理解 Mike 的判断逻辑，也更清楚自己该如何应对。' 
                : "You don’t just pass through. You stay consistently within Mike’s line of judgment. When the market shifts, you’re better able to understand Mike’s reasoning and decide your next move with clarity."}
            </p>
          </>
        )}
        
        {active_days_level_grade === 2 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3] mb-3">
              {language === 'zh' ? '你比 80% 的用户，更完整掌握 Mike 的第一手信息' : "You’re present at Mike’s perspective moments more often than 80% of users."}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[13px] leading-[1.6] whitespace-pre-line">
              {language === 'zh' 
                ? '你不是偶尔路过，而是长期站在 Mike 的判断轨道上。当市场变化出现时，你更容易理解 Mike 的判断逻辑，也更清楚自己该如何应对。' 
                : "You don’t just pass through. You stay consistently within Mike’s line of judgment. When the market shifts, you’re better able to understand Mike’s reasoning and decide your next move with clarity."}
            </p>
          </>
        )}

        {active_days_level_grade === 3 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3] mb-3">
              {language === 'zh' ? '你比 70% 的用户，更完整掌握 Mike 的第一手信息' : "You’re present at Mike’s perspective moments more often than 70% of users."}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[13px] leading-[1.6] whitespace-pre-line">
              {language === 'zh' 
                ? '你不是偶尔路过，而是长期站在 Mike 的判断轨道上。当市场变化出现时，你更容易理解 Mike 的判断逻辑，也更清楚自己该如何应对。' 
                : "You don’t just pass through. You stay consistently within Mike’s line of judgment. When the market shifts, you’re better able to understand Mike’s reasoning and decide your next move with clarity."}
            </p>
          </>
        )}

        {active_days_level_grade === 4 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3] mb-3">
              {language === 'zh' ? '每一段成长，都是从这里开始' : 'Every journey starts somewhere.'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[13px] leading-[1.6] whitespace-pre-line">
              {language === 'zh' 
                ? '很高兴你选择了 Mike App，期待未来与你一起进步、一起变强。' 
                : "We're glad to have you here, and excited to grow stronger together from here on."}
            </p>
          </>
        )}

        {active_days_level_grade === 5 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3] mb-3">
              {language === 'zh' ? '感谢你持续陪伴與支持 Mike' : 'Thank you for continuing to walk alongside Mike.'}
            </p>
            {/* 修改：移除 \n，讓文字自然換行 */}
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[14px] leading-[1.6]">
              {language === 'zh' 
                ? '真正重要的判断，不是关注每天出现的市场声音，当你想重新找回判断节奏时，Mike 与他的思考逻辑，一直都在这里。' 
                : "What truly matters in judgment isn’t following every daily market noise. When you want to realign your sense of direction, Mike and the thinking behind his decisions are always here."}
            </p>
          </>
        )}
      </div>
    </ResponsiveWrapper>
  );
}

// --- Screen 4: Top Functions ---
function Screen4({ userData, uiScale }: { userData: UserData | null; uiScale: number }) {
  const { language } = useLanguage();
  const user_type = userData?.usertype || 2;
  
  const feature_1 = userData?.feature_1 || "語音聊天室 live room";
  const feature_2 = userData?.feature_2 || "麥克精選 mike's pick";
  const feature_3 = userData?.feature_3 || "俱樂部 club";
  const feature_4 = userData?.feature_4 || "麥克交易 mike's trade";
  const feature_5 = userData?.feature_5 || "影片 video";

  const feature_1_vip = userData?.feature_1_vip ?? 1;
  const feature_2_vip = userData?.feature_2_vip ?? 1;
  const feature_3_vip = userData?.feature_3_vip ?? 2;
  const feature_4_vip = userData?.feature_4_vip ?? 1;
  const feature_5_vip = userData?.feature_5_vip ?? 2;

  const allFeatures = [
    { rank: '01', name: feature_1, isVIP: feature_1_vip === 1 },
    { rank: '02', name: feature_2, isVIP: feature_2_vip === 1 },
    { rank: '03', name: feature_3, isVIP: feature_3_vip === 1 },
    { rank: '04', name: feature_4, isVIP: feature_4_vip === 1 },
    { rank: '05', name: feature_5, isVIP: feature_5_vip === 1 },
  ];
  const features = user_type === 1 ? allFeatures.slice(0, 3) : allFeatures;
  const hasVIPFeatures = allFeatures.some(f => f.isVIP);

  const splitFeatureName = (name: string) => {
    const chineseMatch = name.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
    const englishOnly = name.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, '').trim();
    const englishWords = englishOnly ? englishOnly.split(/\s+/).filter(w => w.length > 0) : [];
    let chinese = chineseMatch ? chineseMatch.join('') : '';
    let english = '';
    if (englishWords.length > 0) {
      const firstWord = englishWords[0];
      const isShortAbbreviation = /^[A-Z]{2,4}$/.test(firstWord);
      if (isShortAbbreviation && englishWords.length > 1) {
        chinese = chinese + ' ' + firstWord;
        english = englishWords.slice(1).join(' ');
      } else {
        english = englishWords.join(' ');
      }
    }
    return { chinese: chinese.trim(), english: english.trim() };
  };

  const overlay = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/50 via-[#5B16D6]/40 to-[#4A0FB8]/50 mix-blend-color" />
      <div className="absolute inset-0 bg-[#5B16D6]/30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
    </>
  );

  return (
    <ResponsiveWrapper scale={uiScale} backgroundSrc={imgMikeTradeBackground} backgroundOverlay={overlay} data-name="Top Functions">
      <div className="absolute top-[80px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/60 text-[14px] leading-[1.3] tracking-[0.1em] uppercase mb-2">
          {language === 'zh' ? `你的前 ${user_type === 1 ? '3' : '5'} 名` : `Your Top ${user_type === 1 ? '3' : '5'}`}
        </p>
        <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] leading-[1] tracking-[-0.02em]">
          {language === 'zh' ? '最常使用的\n功能' : 'Most Used\nFeatures'}
        </h2>
      </div>

      <div className={`absolute top-[240px] left-8 right-8 ${user_type === 1 ? 'space-y-5' : 'space-y-3.5'}`}>
        {features.map((feature, index) => {
          const { chinese, english } = splitFeatureName(feature.name);
          const isTop3 = user_type === 1;
          
          // Height-driven hierarchy system
          let heightClass = 'h-[64px]';
          if (isTop3) {
             if(index===0) heightClass = 'h-[150px]';
             else if(index===1) heightClass = 'h-[110px]';
             else heightClass = 'h-[80px]';
          } else {
             if(index===0) heightClass = 'h-[84px]';
             else if(index===1) heightClass = 'h-[72px]';
             else if(index===2) heightClass = 'h-[64px]';
             else if(index===3) heightClass = 'h-[56px]';
             else heightClass = 'h-[48px]';
          }

          // Font sizes
          let chineseSize = 'text-[17px]';
          let englishSize = 'text-[12.5px]';
          let rankSize = 'text-[42px]';

          if (isTop3) {
             if (index === 0) { chineseSize = 'text-[30px]'; englishSize = 'text-[18px]'; rankSize = 'text-[80px]'; }
             else if (index === 1) { chineseSize = 'text-[24px]'; englishSize = 'text-[15px]'; rankSize = 'text-[64px]'; }
             else { chineseSize = 'text-[18px]'; englishSize = 'text-[12px]'; rankSize = 'text-[48px]'; }
          } else {
             if (index === 0) { chineseSize = 'text-[20px]'; englishSize = 'text-[14px]'; rankSize = 'text-[56px]'; }
             else if (index === 1) { chineseSize = 'text-[18px]'; englishSize = 'text-[13px]'; rankSize = 'text-[48px]'; }
             else if (index === 2) { chineseSize = 'text-[17px]'; englishSize = 'text-[12.5px]'; rankSize = 'text-[42px]'; }
             else if (index === 3) { chineseSize = 'text-[16px]'; englishSize = 'text-[12px]'; rankSize = 'text-[36px]'; }
             else { chineseSize = 'text-[15px]'; englishSize = 'text-[11px]'; rankSize = 'text-[32px]'; }
          }
          
          return (
            <div key={index} className={`relative flex items-center ${isTop3 ? 'gap-2' : 'gap-4'}`}>
              <div className={`flex-shrink-0 ${isTop3 ? 'w-16' : 'w-14'} flex items-center ${isTop3 ? 'justify-start' : 'justify-center'}`}>
                <span className={`font-['Space_Grotesk','Noto_Sans_SC'] font-normal text-white/80 ${rankSize} leading-[1]`}>
                  {isTop3 ? index + 1 : feature.rank}
                </span>
              </div>
              <div className="flex-1">
                <div className={`${heightClass} bg-white/15 backdrop-blur-xl ${isTop3 ? 'rounded-2xl' : 'rounded-full'} flex items-center justify-between px-6 shadow-lg shadow-black/10 border border-white/40 relative overflow-hidden`}>
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent ${isTop3 ? 'rounded-2xl' : 'rounded-full'}`} />
                  <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center relative z-10">
                    <p className={`font-['Inter','Noto_Sans_SC'] font-semibold text-white leading-[1.2] tracking-[0.01em] ${chineseSize} ${isTop3 ? 'whitespace-nowrap' : ''} drop-shadow-sm`}>{chinese}</p>
                    <p className={`font-['Inter','Noto_Sans_SC'] font-normal text-white/80 leading-[1.2] tracking-[0.02em] mt-1 ${englishSize} drop-shadow-sm`}>{english}</p>
                  </div>
                  {feature.isVIP && <div className="flex-shrink-0 relative z-10"><Crown className="text-white drop-shadow-md" size={isTop3 ? (index===0?24:index===1?22:20) : 20} strokeWidth={2.5} fill="currentColor" /></div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasVIPFeatures && (
        <div className={`absolute left-8 right-8 ${user_type === 1 ? 'top-[660px]' : 'top-[665px]'}`}>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="text-white" size={20} strokeWidth={2} fill="currentColor" />
              <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[13px] uppercase tracking-wide">{language === 'zh' ? 'VIP 功能' : 'VIP Features'}</p>
            </div>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[13px] leading-[1.5]">
              {language === 'zh' ? '你最常使用的都是高级功能，更即时掌握 Mike 的第一手信息' : 'You use the advanced features most often, getting more immediate and up-to-date information about Mike.'}
            </p>
          </div>
        </div>
      )}
    </ResponsiveWrapper>
  );
}

// --- Screen 5: Evolution ---
function Screen5({ userData, uiScale }: { userData: UserData | null; uiScale: number }) {
  const { language } = useLanguage();
  
  const overlay = (
    <>
      <img alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" src={imgEvolutionBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/25 via-transparent to-[#5B16D6]/15 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
    </>
  );

  const milestones = [
    { month: 'MAR', img: imgChatRoom, title_zh: '文字聊天室', title_en: 'Chat Room', sub_zh: '连接、讨论、与Mike、用戶一起成长', sub_en: 'Connect, discuss, and grow together with Mike and users.' },
    { month: 'AUG', img: imgMikeTrade, title_zh: '投资日誌', title_en: 'Investment Journal', sub_zh: '记录决策、回顾逻辑', sub_en: 'Record decisions, review logic.' },
    { month: 'NOV', img: imgLiveRoom, title_zh: '首页&语音聊天室', title_en: 'Home & Live Room', sub_zh: '以全新形式掌握Mike最新观点', sub_en: "Get Mike's latest insights in a brand new way", large: true }
  ];

  return (
    <ResponsiveWrapper scale={uiScale} backgroundSrc={imgLoginBackground} backgroundOverlay={overlay} data-name="Product Evolution">
      <div className="absolute top-[70px] left-8 right-8">
        <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[36px] leading-[1] tracking-[-0.02em]">
          {language === 'zh' ? '陪你变强的路上，Mike App 也不断在进化' : 'As you grow stronger, Mike App grows with you'}
        </h2>
      </div>
      
      <div className="absolute top-[220px] left-8 right-8 pb-4">
        <div className="absolute left-[22px] top-[24px] w-[2px] h-[420px] bg-gradient-to-b from-white/30 via-white/20 to-white/10" />
        
        {milestones.map((item, idx) => (
          <div key={idx} className={`relative pl-16 ${item.large ? '' : 'mb-4'}`}>
            <div className="absolute left-0 top-0">
               <div className={`w-12 h-12 rounded-full ${item.large ? 'bg-white/30 border-white/60 shadow-lg shadow-white/20' : 'bg-white/15 border-white/30'} backdrop-blur-lg border-2 flex items-center justify-center`}>
                 <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[13px]">{item.month}</p>
               </div>
            </div>
            <div className="bg-white/12 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/25 shadow-xl shadow-black/10">
               <div className={`relative ${item.large ? 'h-[180px]' : 'h-[115px]'} overflow-hidden`}>
                  <img src={item.img} className="absolute inset-0 w-full h-full object-cover opacity-65 scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#5B16D6]/40 via-[#5B16D6]/20 to-transparent" />
                  <div className={`absolute ${item.large ? 'bottom-5 left-5 right-5' : 'bottom-3.5 left-4 right-4'}`}>
                     <h3 className={`font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white ${item.large ? 'text-[28px] mb-3' : 'text-[24px] mb-1.5'} leading-[1.1]`}>
                        {language === 'zh' ? item.title_zh : item.title_en}
                     </h3>
                     <p className={`font-['Inter','Noto_Sans_SC'] font-normal text-white/90 ${item.large ? 'text-[13px]' : 'text-[12px]'} leading-[1.4]`}>
                        {language === 'zh' ? item.sub_zh : item.sub_en}
                     </p>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-[70px] left-8 right-8 text-center">
        <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-medium text-white/80 text-[16px] leading-[1.3] tracking-[-0.01em]">
          {language === 'zh' ? (
            <>一步一步，麦克与你一起成长。<br />—— 2026 年，我们将继续创造更多。</>
          ) : (
            <>Step by step, Mike grew with you.<br />— and in 2026, we'll keep building even more.</>
          )}
        </p>
      </div>
    </ResponsiveWrapper>
  );
}

// --- Screen 5a: Performance ---
function Screen5a({ userData, uiScale }: { userData: UserData | null; uiScale: number }) {
  const { language } = useLanguage();
  
  // 1. 判斷用戶身份
  const premium_user_type = userData?.premium_user_type || 3;
  const isPremium = premium_user_type === 1 || premium_user_type === 2;

  // 2. 數字滾動動畫 Hook
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 2000; // 2秒
    const finalValue = 42;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease Out Cubic 效果
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * finalValue));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, []);

  const overlay = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/50 via-[#5B16D6]/40 to-[#4A0FB8]/50 mix-blend-color" />
      <div className="absolute inset-0 bg-[#5B16D6]/30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
    </>
  );

  return (
    <ResponsiveWrapper scale={uiScale} backgroundSrc={imgMikeTradeBackground} backgroundOverlay={overlay} data-name="Portfolio Performance">
       <div className="absolute top-[80px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/60 text-[14px] leading-[1.3] tracking-[0.1em] uppercase mb-2">
          {language === 'zh' ? '2025策略年度表现' : '2025 strategy performance'}
        </p>
        <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] leading-[1.1] tracking-[-0.02em]">
          {language === 'zh' ? '麦克精选' : "Mike's Pick"}
        </h2>
      </div>
      
      <div className="absolute top-[200px] left-8 right-8 flex flex-col gap-3">
        
        {/* Hero stat: 修改處 - 增加光暈與金色漸層 */}
        <div className="relative bg-white/15 backdrop-blur-2xl rounded-3xl p-8 border border-white/25 shadow-xl shadow-black/10 overflow-hidden group">
           {/* 背景金色呼吸光暈 (裝飾用) */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[#FFD700] opacity-20 blur-[80px] animate-pulse pointer-events-none"></div>
           
           <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[13px] uppercase tracking-wide mb-3 relative z-10">
             {language === 'zh' ? '总收益' : 'Total Return'}
           </p>
           
           {/* 金色漸層數字 + 滾動效果 */}
           <h1 className="relative z-10 font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-[96px] leading-[0.9] tracking-[-0.04em]
             text-transparent bg-clip-text bg-gradient-to-b from-[#FFEDAD] via-[#FFD700] to-[#FFA500] 
             drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
             +{count}%
           </h1>
        </div>
        
        {/* Benchmark */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
           <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[13px] uppercase tracking-wide mb-3">{language === 'zh' ? '对比基准' : 'vs Benchmark'}</p>
           <div className="flex items-center gap-3">
             <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.9] tracking-[-0.03em]">2.6×</p>
             <div>
                <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white text-[15px] leading-[1.3]">{language === 'zh' ? '优于' : 'better than'}</p>
                <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-semibold text-white text-[15px] leading-[1.3]">S&P 500 (+16%)</p>
             </div>
           </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
             <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.9] tracking-[-0.03em] mb-2">11</p>
             <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/80 text-[13px] leading-[1.4]">{language === 'zh' ? '档股票翻超过一倍' : 'stocks doubled'}</p>
             <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[12px] mt-1">+100% {language === 'zh' ? '或更多' : 'or more'}</p>
           </div>
           <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
             <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.9] tracking-[-0.03em] mb-2">6</p>
             <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/80 text-[13px] leading-[1.4]">{language === 'zh' ? '档股票翻超过两倍' : 'stocks tripled'}</p>
             <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[12px] mt-1">+200% {language === 'zh' ? '或更多' : 'or more'}</p>
           </div>
        </div>

        {/* 底部文字區塊 */}
        <div className="mt-2 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg">
           <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[14px] leading-[1.6] text-center whitespace-pre-line">
             {isPremium ? (
               language === 'zh' 
                 ? '当大盘上涨 16% 时，Mike 精选交出 42% 的成绩。\n很高兴这一年能与你一起，把握先机、共享这段成长旅程。'
                 : "While the market gained 16%, Mike’s Picks delivered 42%. We’re glad to have navigated this journey and grown together with you."
             ) : (
               language === 'zh'
                 ? '当大盘上涨 16% 时，Mike 精选交出 42% 的成绩。\n今年的节奏已经走过，希望明年你能一起加入，别再错过重要的时刻。'
                 : "While the market gained 16%, Mike’s Picks delivered 42%. This year has passed — we hope you’ll join us next time and catch the moments that matter."
             )}
           </p>
        </div>

      </div>
    </ResponsiveWrapper>
  );
}

// --- Screen 8: User Type (With Analysis Animation) ---
function Screen8({ 
  userData, 
  isCompact = false, 
  uiScale, 
  onNext 
}: { 
  userData: UserData | null; 
  isCompact?: boolean; 
  uiScale: number; 
  onNext?: () => void; 
}) {
  const { language } = useLanguage();
  
  // --- 新增：分析動畫控制 ---
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loadingText, setLoadingText] = useState(language === 'zh' ? '分析交易数据...' : 'Analyzing trade data...');

  useEffect(() => {
    // 檢查本次 Session 是否已經播放過
    const hasPlayed = sessionStorage.getItem('mike_wrap_analysis_played');

    if (!hasPlayed) {
      setShowAnalysis(true);
      
      // 模擬分析進度文字變化
      setTimeout(() => {
        setLoadingText(language === 'zh' ? '生成你的投资人格...' : 'Generating persona...');
      }, 1000);

      // 2秒後結束動畫
      const timer = setTimeout(() => {
        setShowAnalysis(false);
        sessionStorage.setItem('mike_wrap_analysis_played', 'true'); // 標記為已播放
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [language]);
  // -----------------------

  const mike_type = userData?.mike_type || 3;
  const user_type = userData?.usertype || 2;
  const premium_user_type = userData?.premium_user_type || 3;
  const hasNextPage = premium_user_type === 1 || premium_user_type === 2;

  // 1. 設定圖片對應表
  const shareImages: Record<number, Record<string, string>> = {
    1: { zh: imgType1Zh, en: imgType1En },
    2: { zh: imgType2Zh, en: imgType2En },
    3: { zh: imgType3Zh, en: imgType3En },
    4: { zh: imgType4Zh, en: imgType4En }
  };

  // 2. 內容對應表
  const contentMap = {
     1: { 
         title_zh: "社群\n连接者", 
         desc_zh: "你擅长借力集体的智慧，在共鸣中寻找答案，将众人的灵感内化为自己的决策。这种对信息流的敏锐捕捉，让你在市场中不再是孤军奋战。",
         title_en: "Community\nConnector", 
         subtitle_en: "You grow faster when you learn with others.",
         tagline_en: "Perspective is your real advantage."
     },
     2: { 
         title_zh: "信号\n狙击手", 
         desc_zh: "你不为噪音所动，只在信号明确的瞬间果断出手。这种不轻易出鞘的克制，让你總能踩準市場的節拍。在波動的環境中，這份定力是你最強大的武器。",
         title_en: "Signal\nHunter", 
         subtitle_en: "You move when timing matters.",
         tagline_en: "Signals guide your decisions."
     },
     3: { 
         title_zh: "情报\n分析师", 
         desc_zh: "你在事件背后的底层逻辑中寻找答案。这种稳扎稳打的风格，让你在面对波动时比别人多了一份从容。你构建优势的方式，是让每一笔决策都有据可依。",
         title_en: "Insight\nCollector", 
         subtitle_en: "You look for the \"why\" behind every move.",
         tagline_en: "Understanding comes before action."
     },
     4: { 
         title_zh: "系统\n架构师", 
         desc_zh: "你深知，一套成熟的体系远比运气更重要。你习惯将复杂的操作磨炼成可重复的纪律，就算市场震荡，你的动作依然有章法。",
         title_en: "System\nCrafter", 
         subtitle_en: "You turn ideas into repeatable decisions.",
         tagline_en: "Process keeps you sharp."
     }
  };
  // @ts-ignore
  const content = contentMap[mike_type] || contentMap[3];

  const handleSaveImage = () => {
    const targetImage = shareImages[mike_type]?.[language];
    if (!targetImage) return;

    const link = document.createElement('a');
    link.href = targetImage;
    link.download = `MikeWrap_2025_${mike_type}_${language}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (userData?.account) {
       trackUserEvent({ account: userData.account, clicked_button: 'screen8_save_image' });
    }
  };

  const overlay = (
    <>
      <img alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" src={imgUserTypeBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/30 via-transparent to-[#5B16D6]/20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </>
  );
  const bgGradientClass = "bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]";

  // --- 新增：分析畫面渲染 ---
  if (showAnalysis) {
    return (
      <ResponsiveWrapper scale={uiScale} backgroundColor={bgGradientClass} backgroundOverlay={overlay} data-name="Analyzing">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* 呼吸燈圓圈 */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping opacity-50"></div>
              <div className="absolute inset-0 border-4 border-white/40 rounded-full animate-pulse"></div>
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                 <div className="w-10 h-10 bg-white/90 rounded-full animate-bounce"></div>
              </div>
            </div>

            {/* 分析文字 */}
            <div className="mt-8 text-center space-y-2">
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[24px] tracking-widest uppercase animate-pulse">
                Analyzing
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[14px] animate-in fade-in slide-in-from-bottom-2 duration-500 key={loadingText}">
                {loadingText}
              </p>
            </div>
        </div>
      </ResponsiveWrapper>
    );
  }
  // -----------------------

  return (
    <ResponsiveWrapper scale={uiScale} backgroundColor={bgGradientClass} backgroundOverlay={overlay} data-name="User Type">
       <div className="relative w-full h-full flex flex-col animate-in fade-in duration-700"> {/* 加上淡入效果，讓切換更順滑 */}
          
          {/* Icon SVG */}
          <div className="absolute top-[140px] left-1/2 -translate-x-1/2 w-[280px] h-[280px] opacity-20 pointer-events-none">
             <svg viewBox="0 0 280 280" fill="none"><circle cx="70" cy="70" r="30" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1"/><circle cx="210" cy="70" r="30" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1"/><circle cx="140" cy="180" r="35" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.15"/><circle cx="50" cy="210" r="25" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1"/><circle cx="230" cy="210" r="25" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1"/><line x1="85" y1="85" x2="125" y2="165" stroke="white" strokeWidth="3" opacity="0.4"/><line x1="195" y1="85" x2="155" y2="165" stroke="white" strokeWidth="3" opacity="0.4"/><line x1="115" y1="195" x2="70" y2="200" stroke="white" strokeWidth="3" opacity="0.4"/><line x1="165" y1="195" x2="210" y2="200" stroke="white" strokeWidth="3" opacity="0.4"/></svg>
          </div>

          {/* 1. Header: Label + Intro */}
          <div className={`absolute ${isCompact ? 'top-[60px]' : 'top-[70px]'} left-8 right-8 text-center`}>
             <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/50 text-[11px] uppercase tracking-[0.2em] mb-2">
               {language === 'zh' ? '你的麦克类型' : 'YOUR MIKE TYPE'}
             </p>
             <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/90 text-[15px] leading-tight text-shadow-sm">
               {language === 'zh' ? '分析你的活动后，你是一位…' : "After analyzing your activity, you're a..."}
             </p>
          </div>

          {/* 2. Main Title & Subtitle */}
          <div className={`absolute ${isCompact ? 'top-[260px]' : 'top-[280px]'} left-0 right-0 text-center px-4`}>
             {/* Title */}
             <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.95] whitespace-pre-line drop-shadow-lg">
                 {language === 'zh' ? content.title_zh : content.title_en}
             </h1>
             
             {/* English Subtitle */}
             {language !== 'zh' && (
               <div className="mt-14 px-4">
                 <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.3] tracking-[-0.01em] drop-shadow-md">
                   {content.subtitle_en}
                 </p>
               </div>
             )}
          </div>

          {/* 3. Description Area (中文描述區) */}
          <div className={`absolute ${isCompact ? 'top-[420px]' : 'top-[450px]'} left-8 right-8 text-center`}>
             {language === 'zh' ? (
                <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/90 text-[15px] leading-relaxed whitespace-pre-line drop-shadow-md">
                   {content.desc_zh}
                </p>
             ) : null}
          </div>

          {/* 3.5 English Tagline (英文金句) */}
          {language !== 'zh' && (
             <div className="absolute bottom-[300px] left-8 right-8 text-center">
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[14px] leading-relaxed drop-shadow-sm">
                   {content.tagline_en}
                </p>
             </div>
          )}

          {/* 4. Buttons Area */}
          <div className="absolute bottom-[120px] left-8 right-8 space-y-3 z-50">
             <button 
                 onClick={handleSaveImage} 
                 className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-xl hover:bg-white/20 transition-all active:scale-95 cursor-pointer relative z-50 pointer-events-auto"
             >
                 {language === 'zh' ? '保存图片' : 'Save Image'}
             </button>
             
             <button 
                 onClick={() => {
                   const url = user_type === 1 ? 'https://www.cmoney.tw/r/236/2vltex' : 'https://www.cmoney.tw/r/236/v6nu30';
                   navigateWithTrack(url, 'screen8_share', userData?.account || '');
                 }}
                 className="w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-xl hover:bg-white/95 transition-all active:scale-95 cursor-pointer relative z-50 pointer-events-auto"
             >
                 {language === 'zh' ? '分享' : 'Share'}
             </button>
          </div>

          {/* 5. Exclusive Offer Hint */}
          {hasNextPage && (
            <div 
              onClick={onNext}
              className="absolute bottom-[10px] left-0 right-0 flex flex-col items-center animate-bounce z-50 cursor-pointer pointer-events-auto group"
            >
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-lg px-6 py-2.5 rounded-full border border-white/25 shadow-2xl transition-all duration-300 group-hover:bg-black/60 group-hover:scale-105 group-active:scale-95">
                <span className="text-white font-['Inter','Noto_Sans_SC'] font-bold text-[16px] tracking-wide drop-shadow-md">
                  {language === 'zh' ? '还有专属礼遇' : 'Exclusive Offer'}
                </span>
                <ChevronRight className="text-white w-5 h-5 drop-shadow-md" strokeWidth={3} />
              </div>
              <p className="text-white/60 text-[11px] mt-2 uppercase tracking-[0.2em] font-bold drop-shadow-sm group-hover:text-white/80 transition-colors">
                {language === 'zh' ? '点击前往' : 'TAP TO VIEW'}
              </p>
            </div>
          )}
       </div>
    </ResponsiveWrapper>
  );
}


// --- Screen 9: Premium Reminder ---
function Screen9({ userData, uiScale }: { userData: UserData | null; uiScale: number }) {
  const { language } = useLanguage();
  const premium_user_type = userData?.premium_user_type || 1;
  if (premium_user_type === 3) return null;
  
  // Track View on Mount
  useEffect(() => {
    if (userData?.account) {
        trackUserEvent({ account: userData.account, clicked_button: 'screen9_view' });
    }
  }, []);

  const feature_1 = userData?.feature_1 || "语音聊天室 Live Room";
  const feature_2 = userData?.feature_2 || "麦克精选 Mike's Pick";
  const feature_3 = userData?.feature_3 || "社团 Club";
  const feature_4 = userData?.feature_4 || "投资日誌 Mike's Investment Journal";
  const feature_5 = userData?.feature_5 || "内容专区影音 Video";

  const feature_1_vip = userData?.feature_1_vip ?? 1;
  const feature_2_vip = userData?.feature_2_vip ?? 1;
  const feature_3_vip = userData?.feature_3_vip ?? 2;
  const feature_4_vip = userData?.feature_4_vip ?? 1;
  const feature_5_vip = userData?.feature_5_vip ?? 2;

  const splitFeatureName = (name: string) => {
    const chineseMatch = name.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
    const englishOnly = name.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, '').trim();
    const englishWords = englishOnly ? englishOnly.split(/\s+/).filter(w => w.length > 0) : [];
    let chinese = chineseMatch ? chineseMatch.join('') : '';
    let english = '';
    if (englishWords.length > 0) {
      const firstWord = englishWords[0];
      const isShortAbbreviation = /^[A-Z]{2,4}$/.test(firstWord);
      if (isShortAbbreviation && englishWords.length > 1) {
        chinese = chinese + ' ' + firstWord;
        english = englishWords.slice(1).join(' ');
      } else {
        english = englishWords.join(' ');
      }
    }
    return { chinese: chinese.trim(), english: english.trim() };
  };

  const allFeatures = [
    { name: feature_1, isVIP: feature_1_vip === 1 },
    { name: feature_2, isVIP: feature_2_vip === 1 },
    { name: feature_3, isVIP: feature_3_vip === 1 },
    { name: feature_4, isVIP: feature_4_vip === 1 },
    { name: feature_5, isVIP: feature_5_vip === 1 },
  ];
  
  const vipFeatures = allFeatures
    .filter(f => f.isVIP)
    .slice(0, 3)
    .map(f => splitFeatureName(f.name));

  const overlay = (
    <>
      <img alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" src={imgLoginBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/20 via-transparent to-[#5B16D6]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5" />
    </>
  );

  const expiryDate = premium_user_type === 1 ? '2/4' : '2/19';
  const priceCurrent = premium_user_type === 1 ? 'US$469' : 'US$509';
  const priceFuture = 'US$559';
  const expiryDateEn = premium_user_type === 1 ? 'Feb 4' : 'Feb 19';

  return (
    <ResponsiveWrapper scale={uiScale} backgroundColor="bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" backgroundOverlay={overlay} data-name="Premium Reminder">
      <div className="absolute top-[70px] left-8 right-8">
        <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[20px] leading-[1.2] tracking-[-0.02em] text-center">
          {language === 'zh' ? '感谢身为Mike App第一批支持者的你' : 'Thank you for being one of the first supporters of the Mike App'}
        </h1>
      </div>
      
      <div className="absolute top-[140px] left-6 right-6 flex flex-col gap-4">
         <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-2xl">
            
            {/* 1. 到期日提醒 */}
            <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-white/10">
                <Clock className="text-[#FF8F8F] w-5 h-5 animate-pulse" />
                <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white text-[16px] text-center">
                  {language === 'zh' ? (
                     <>VIP 权限将于 <span className="text-[#FF8F8F] font-bold text-[18px]">{expiryDate}</span> 到期</>
                  ) : (
                     <>VIP access expires on <span className="text-[#FF8F8F] font-bold text-[18px]">{expiryDateEn}</span></>
                  )}
                </p>
            </div>

            {/* 2. 核心優惠區塊 (修改重點：置中佈局 + 價格巨大化) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 border border-[#FFD700]/60 rounded-2xl p-5 mb-4 shadow-[0_0_15px_rgba(255,215,0,0.15)] group">
                {/* 裝飾閃光 */}
                <div className="absolute top-0 right-0 p-2 opacity-30"><Sparkles className="text-[#FFD700] w-12 h-12" /></div>
                
                {/* 改用 items-center 和 text-center 讓內容置中 */}
                <div className="flex flex-col items-center text-center gap-1 relative z-10">
                    <div className="flex items-center justify-center gap-2 text-[#FFD700] mb-1">
                        <Gift className="w-5 h-5" />
                        <span className="font-bold text-[13px] uppercase tracking-wider">{language === 'zh' ? '限时续订礼遇' : 'Limited Time Offer'}</span>
                    </div>

                    <p className="font-['Inter','Noto_Sans_SC'] text-white/90 text-[13px] leading-relaxed">
                       {language === 'zh' ? (
                          <>在 <span className="font-bold text-white border-b border-white/40">{expiryDate}</span> 前续订，保留终生早鸟价</>
                       ) : (
                          <>Renew by <span className="font-bold text-white border-b border-white/40">{expiryDateEn}</span> to keep early-bird price</>
                       )}
                    </p>

                    {/* 修改重點：獨立一行顯示巨大價格 */}
                    <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-[#FFD700] text-[42px] leading-[1.1] drop-shadow-md my-1">
                      {priceCurrent}
                    </h2>

                    {/* 修改重點：加大送一個月按鈕 */}
                    <div className="mt-1 flex items-center justify-center gap-2 bg-[#FFD700] px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.4)] animate-pulse">
                        <span className="font-['Inter','Noto_Sans_SC'] font-bold text-[#5B16D6] text-[15px]">
                            {language === 'zh' ? '+ 加送 1 个月权限' : '+ Free 1 Month Bonus'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. 漲價預警 */}
            <div className="flex items-start gap-3 bg-black/20 rounded-xl p-3 border border-white/5">
                <TrendingUp className="text-[#FF8F8F] w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/80 text-[13px] leading-[1.4]">
                  {language === 'zh' ? (
                     <>过期后，年方案价格将調漲至 <span className="text-white font-semibold underline decoration-[#FF8F8F]">{priceFuture}</span> 以上，早鸟优惠错过不再。</>
                  ) : (
                     <>After expiry, the price rises to <span className="text-white font-semibold underline decoration-[#FF8F8F]">{priceFuture}</span>+. Don't miss the early-bird rate.</>
                  )}
                </p>
            </div>

         </div>
         
         {/* VIP 功能回顧 */}
         {vipFeatures.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex flex-col items-center">
            <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/60 text-[12px] mb-2">
              {language === 'zh' ? '你最常使用的 VIP 功能' : 'Your Top VIP Features'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {vipFeatures.map((feature, index) => (
                <span key={index} className="bg-white/10 rounded-full px-3 py-1 text-white text-[11px] border border-white/10">
                  {language === 'zh' ? feature.chinese : feature.english}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 按鈕區 */}
      <div className="absolute bottom-[60px] left-8 right-8">
         <button 
           onClick={() => {
             const renewUrl = premium_user_type === 1 ? 'https://cmy.tw/00Cl6t' : 'https://cmy.tw/00CnkI';
             navigateWithTrack(renewUrl, 'screen9_renew_plan', userData?.account || '');
           }}
           className="w-full bg-gradient-to-r from-white via-white to-[#F0F0F0] text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all mb-3 relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
            {language === 'zh' ? '立即续订方案' : 'Renew Plan Now'}
         </button>
         
         <button 
           className="w-full text-white/50 font-['Inter','Noto_Sans_SC'] font-medium text-[14px] hover:text-white/80 transition-colors py-2"
           onClick={() => {
              navigateWithTrack('https://www.cmoney.tw/r/236/v6nu30', 'screen9_not_now', userData?.account || '');
           }}
         >
           {language === 'zh' ? '暂时不要' : 'Not now'}
         </button>
      </div>

      <div className="absolute bottom-[30px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/30 text-[11px] leading-[1.4] text-center">
          {language === 'zh' 
            ? '我们只是不想让你意外失去访问权限' 
            : "We just don't want you to lose access by surprise."}
        </p>
      </div>
    </ResponsiveWrapper>
  );
}

// --- Main Component ---
export default function MikeWrap() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [uiScale, setUiScale] = useState(1);
  const [showNavHint, setShowNavHint] = useState(false);

  // 1. Calculate Scale
  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === 'undefined') return;
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleWidth = viewportWidth / 390;
      const scaleHeight = viewportHeight / 844;
      
      // Use containment but allow slight overflow for taller/narrower screens
      let newScale = Math.min(scaleWidth, scaleHeight);
      
      // Limit max scale to prevent oversized UI on desktops
      newScale = Math.min(newScale, 1.2); 
      setUiScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
    };
  }, []);

  // 2. Keyboard Navigation Support (電腦版鍵盤左右鍵換頁)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!userData) return;
      if (e.key === 'ArrowRight') {
        handleScreenChange(currentScreen + 1);
      } else if (e.key === 'ArrowLeft') {
        // 修改: 加入這個檢查，如果當前是 index 1 (Screen 2)，就不執行上一頁
        if (currentScreen > 1) { 
          handleScreenChange(currentScreen - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, userData]); // Dependency on currentScreen to ensure state is fresh

  const loadUserData = async (account: string) => {
    try {
       const data = await getUserData(account);
       if(data) {
          setUserData(data);
          trackUserEvent({ account: data.account, clicked_button: 'view_wrap_success' });
          setShowNavHint(true);
          setCurrentScreen(1);
          return true;
       }
       return false;
    } catch(e) { return false; }
  };

  const handleScreenChange = (newScreen: number) => {
    // Only allow navigation if user is logged in or if navigating to login screen (index 0)
    // Also check bounds
    if ((newScreen === 0 || userData !== null) && newScreen >= 0 && newScreen < screens.length) {
      setCurrentScreen(newScreen);
    }
  };

  const premiumUserType = userData?.premium_user_type ?? 3;
  
  // Define screens array
  const screens = [
    <Screen1 key="s1" onAccountRecognized={()=>{}} onLoadUserData={loadUserData} uiScale={uiScale} />,
    <Screen2 key="s2" userData={userData} uiScale={uiScale} />,
    <Screen3 key="s3" userData={userData} uiScale={uiScale} />,
    <Screen4 key="s4" userData={userData} uiScale={uiScale} />,
    <Screen5 key="s5" userData={userData} uiScale={uiScale} />,
    <Screen5a key="s5a" userData={userData} uiScale={uiScale} />,
    
    // Pass onNext to Screen8
    <Screen8 
      key="s8" 
      userData={userData} 
      isCompact={uiScale < 0.85} 
      uiScale={uiScale} 
      onNext={() => handleScreenChange(currentScreen + 1)}
    />,
    
    ...(premiumUserType === 1 || premiumUserType === 2 ? [<Screen9 key="s9" userData={userData} uiScale={uiScale} />] : []),
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="bg-[#5B16D6] relative w-full h-full overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        
        {/* Story Progress Bar (Fixed at top) */}
        {/* 優化：加上 max-w-[400px] mx-auto 讓進度條在電腦版不會拉太長，跟卡片對齊 */}
        {userData !== null && currentScreen > 0 && (
          <div className="absolute top-0 left-0 right-0 z-50 flex justify-center w-full pointer-events-none">
            <div className="w-full max-w-[400px] relative pointer-events-auto">
              <StoryProgress 
                 total={screens.length - 1} // Exclude login screen
                 current={currentScreen - 1} 
                 onNavigate={(idx) => handleScreenChange(idx + 1)}
              />
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="w-full h-full relative">
           {screens[currentScreen]}
        </div>

        {/* --- Navigation Controls --- */}
        {userData !== null && (
          <>
            {/* 1. Mobile & Tablet: Invisible Touch Zones (手機版維持原樣) */}
            <button 
              onClick={() => handleScreenChange(currentScreen - 1)} 
              // 修改 1: 改成 <= 1 (在登錄頁和第一張數據頁都禁用回上一頁)
              disabled={currentScreen <= 1}
              // 修改 2: 樣式同步隱藏
              className={`md:hidden absolute left-0 top-[20%] bottom-[20%] w-[30%] z-40 outline-none ${currentScreen <= 1 ? 'hidden' : 'block'}`}
              aria-label="Previous"
            />
            <button 
              onClick={() => handleScreenChange(currentScreen + 1)} 
              // 修改 1: 加上 currentScreen === 0，在登錄頁停用下一頁觸發
              disabled={currentScreen >= screens.length - 1 || currentScreen === 0}
              // 修改 2: 同步修改 className，讓它在登錄頁也 hidden (不擋住點擊)
              className={`md:hidden absolute right-0 top-[20%] bottom-[20%] w-[30%] z-40 outline-none ${(currentScreen >= screens.length - 1 || currentScreen === 0) ? 'hidden' : 'block'}`}
              aria-label="Next"
            />

            {/* 2. Desktop: Visible Floating Arrows (電腦版顯示明確箭頭) */}
            {/* 左箭頭：定位在中心點往左 280px (卡片寬度一半 195 + 間距) */}
            <button
              onClick={() => handleScreenChange(currentScreen - 1)}
              // 修改 1: 改成 <= 1
              disabled={currentScreen <= 1}
              className={`hidden md:flex absolute top-1/2 left-[calc(50%-280px)] -translate-y-1/2 z-50 
                w-12 h-12 items-center justify-center rounded-full 
                bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 
                transition-all duration-200 active:scale-95 outline-none
                // 修改 2: 改成 <= 1，讓它在第一張數據卡時也消失
                ${currentScreen <= 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
              >
              <ChevronLeft className="text-white w-6 h-6" />
            </button>

            {/* 右箭頭：定位在中心點往右 280px */}
            <button
              onClick={() => handleScreenChange(currentScreen + 1)}
              // 修改 1: 加入 currentScreen === 0
              disabled={currentScreen >= screens.length - 1 || currentScreen === 0}
              className={`hidden md:flex absolute top-1/2 right-[calc(50%-280px)] -translate-y-1/2 z-50 
                w-12 h-12 items-center justify-center rounded-full 
                bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 
                transition-all duration-200 active:scale-95 outline-none
                // 修改 2: 加入 currentScreen === 0
                ${(currentScreen >= screens.length - 1 || currentScreen === 0) ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
              >
              <ChevronRight className="text-white w-6 h-6" />
            </button>
          </>
        )}

        {/* Hint Overlay (First time) */}
        {showNavHint && userData && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNavHint(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-[280px] text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <p className="text-[#5B16D6] font-bold text-lg mb-2">{language === 'zh' ? '操作提示' : 'Tip'}</p>
              <p className="text-gray-600 text-sm mb-4">
                {language === 'zh' 
                  ? '手機切換頁面請點擊螢幕兩側，電腦則使用鍵盤 ← → 或點擊鍵頭按鈕' 
                  : 'Use screen edges to navigate on mobile, or click the arrow buttons or ← → keys on desktop.'}
              </p>
              <button className="bg-[#5B16D6] text-white px-6 py-2 rounded-full text-sm font-bold">OK</button>
            </div>
          </div>
        )}
      </div>
    </LanguageContext.Provider>
  );
}
