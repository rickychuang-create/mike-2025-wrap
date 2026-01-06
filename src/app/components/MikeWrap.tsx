import svgPaths from "../../imports/svg-3vt1zivl9b";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import imgLoginBackground from "../../assets/56b5c5268002dc2dc0d66c169166bd1b809f2baa.png";
import imgUserTypeBackground from "../../assets/9466ce84f3972cbe4812a57f95a8b27a5849e013.png";
import imgTopFunctionsBackground from "../../assets/d4a720df43c93a5bfb3b5c46a555a8a46169db5e.png";
import imgEvolutionBackground from "../../assets/0daf03c8cb905fd16c7b536a4d85f7c1bf293f1f.png";
import imgMikeTradeBackground from "../../assets/eb3f6061e5e4daec8146192551ab468a94cfbb68.png";
import imgActiveDaysBackground from "../../assets/2e5e3c0b2d1d3df6c5e419e0cb0f09ad18e7c95f.png";
import { Crown, Camera } from "lucide-react";
import imgChatRoom from "../../assets/130e47bc5599e981dd3764fa04f621aae6c9500f.png";
import imgMikeTrade from "../../assets/7b5e13d4c387d8ba7a5cf0ad5e8e632742979b1c.png";
import imgLiveRoom from "../../assets/8edafb93c55a63e088100ef79ef041df60a69b06.png";
import { recognizeAccount } from "../api/gemini";
import { getUserData, UserData } from "../api/sheets";

const imgScreen3Background = "https://images.unsplash.com/photo-1760442903597-6aeb6f23212f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBncmFkaWVudCUyMHNvZnR8ZW58MXx8fHwxNzY3MDEyMTc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

// Language Context
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

// 預設資料（當沒有用戶資料時使用）
const DEFAULT_WRAP_DATA = {
  days_with_mike: 232,
  active_days: 196,
  login_percentage: 84,
  active_days_level_grade: 5, // 1-5 based on user's activity level
};

// 將 UserData 映射到 WRAP_DATA 格式的輔助函數
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

type StatusBarTextProps = {
  text: string;
  isDark?: boolean;
};

function StatusBarText({ text, isDark = false }: StatusBarTextProps) {
  const strokeColor = isDark ? "#ffffff" : "#1E1E1E";
  const fillColor = isDark ? "#ffffff" : "#1E1E1E";
  const textColor = isDark ? "text-white" : "text-[#1e1e1e]";

  return (
    <div className="absolute h-[47px] left-0 overflow-clip top-0 w-[390px]">
      <div className="absolute h-[13px] right-[18px] top-[18px] w-[25px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 13">
          <g id="Battery">
            <path d={svgPaths.p389e5ad0} id="Rectangle" opacity="0.35" stroke={strokeColor} />
            <path d={svgPaths.p1f70d00} fill={fillColor} id="Combined Shape" opacity="0.4" />
            <path d={svgPaths.p3fe32bf0} fill={fillColor} id="Rectangle_2" />
          </g>
        </svg>
      </div>
      <div className="absolute h-[12px] right-[49px] top-[18px] w-[16px]" data-name="Wifi">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 12">
          <path clipRule="evenodd" d={svgPaths.p271e8000} fill={fillColor} fillRule="evenodd" id="Wifi" />
        </svg>
      </div>
      <div className="absolute h-[10px] right-[71px] top-[20px] w-[17px]" data-name="Cellular">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 10">
          <path clipRule="evenodd" d={svgPaths.pf9b5040} fill={fillColor} fillRule="evenodd" id="Cellular" />
        </svg>
      </div>
      <p className={`absolute font-['SF_Pro_Text:Semibold',sans-serif] leading-[normal] left-[34px] not-italic text-[15px] text-nowrap top-[16px] ${textColor}`}>{text}</p>
    </div>
  );
}

// 檔案轉 base64 的輔助函數
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

function Screen1({
  onAccountRecognized,
  onSeeWrap,
  onLoadUserData,
}: {
  onAccountRecognized?: (account: string) => void;
  onSeeWrap?: () => void;
  onLoadUserData?: (account: string) => Promise<boolean>;
}) {
  const { language, setLanguage } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountInput, setAccountInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證檔案大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        language === 'zh' 
          ? '圖片大小超過 5MB，請上傳較小的圖片'
          : 'Image size exceeds 5MB, please upload a smaller image'
      );
      return;
    }

    // 驗證檔案格式
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrorMessage(
        language === 'zh'
          ? '不支援的圖片格式，請上傳 JPEG、PNG 或 WebP 格式'
          : 'Unsupported image format, please upload JPEG, PNG, or WebP'
      );
      return;
    }

    // 清除之前的錯誤
    setErrorMessage(null);
    setIsRecognizing(true);

    try {
      // 轉換為 base64
      const base64 = await fileToBase64(file);
      
      // 顯示上傳的圖片
      setUploadedImage(base64);
      
      // 呼叫 API
      const result = await recognizeAccount(base64);

      if (result.status === 'ok' && result.account_prefix) {
        // 成功：自動填入帳號
        setAccountInput(result.account_prefix);
        // 辨識成功後清除圖片預覽（避免擋住按鈕）
        setUploadedImage(null);
        if (onAccountRecognized) {
          onAccountRecognized(result.account_prefix);
        }
      } else {
        // 失敗：顯示錯誤訊息
        const message = language === 'zh' 
          ? (result.user_message_zh || '辨識失敗，請稍後再試')
          : (result.user_message_en || result.user_message_zh || 'Recognition failed, please try again');
        setErrorMessage(message);
      }
    } catch (error) {
      // API 呼叫失敗
      console.error('圖片辨識錯誤:', error);
      setErrorMessage(
        language === 'zh'
          ? '系統忙碌中，請稍後再試'
          : 'System is busy, please try again later'
      );
    } finally {
      setIsRecognizing(false);
    }
  };
  
  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-[#5B16D6]" data-name="Login">
      {/* Background */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full" src={imgLoginBackground} />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      {/* Language Toggle - Top right */}
      <div className="absolute top-[60px] right-8 z-10">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xl border border-white/25 rounded-full p-1">
          <button
            onClick={() => setLanguage('zh')}
            className={`px-4 py-1.5 rounded-full font-['Inter','Noto_Sans_SC'] font-medium text-[13px] transition-all ${
              language === 'zh'
                ? 'bg-white text-[#5B16D6] shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            简中
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full font-['Inter','Noto_Sans_SC'] font-medium text-[13px] transition-all ${
              language === 'en'
                ? 'bg-white text-[#5B16D6] shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            EN
          </button>
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
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[13px] mb-1">
                  {language === 'zh' ? '账户' : 'Account'}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={accountInput}
                    onChange={(e) => setAccountInput(e.target.value)}
                    placeholder="example123@gmail.com"
                    className="flex-1 bg-transparent font-['Inter','Noto_Sans_SC'] font-medium text-white text-[15px] outline-none placeholder:text-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Upload screenshot"
                  >
                    <Camera className="size-5 text-white/60" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {/* 載入狀態顯示 */}
                {isRecognizing && (
                  <div className="mt-2 flex items-center gap-2 text-white/70 text-[13px]">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <span>
                      {language === 'zh' ? '辨識中...' : 'Recognizing...'}
                    </span>
                  </div>
                )}
                
                {/* 錯誤訊息顯示 */}
                {errorMessage && (
                  <p className="mt-2 text-red-300 text-[13px]">
                    {errorMessage}
                  </p>
                )}
                
                {/* 上傳的圖片預覽 */}
                {uploadedImage && !isRecognizing && (
                  <div className="mt-3">
                    <img src={uploadedImage} alt="Uploaded screenshot" className="w-full rounded-lg" />
                  </div>
                )}
              </div>
            </div>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/60 text-[13px] leading-[1.5]">
              {language === 'zh' 
                ? <>请输入你登录 Mike App 使用的账号（@ 前的部分），或上传<a href="https://www.cmoney.tw/r/236/np8nqw" target="_blank" rel="noopener noreferrer" className="underline cursor-pointer hover:text-white/80 transition-colors">「更多页」</a>的截图。</>
                : <>Enter the account you use to log in to Mike App (the part before @), or upload a screenshot of the <a href="https://www.cmoney.tw/r/236/np8nqw" target="_blank" rel="noopener noreferrer" className="underline cursor-pointer hover:text-white/80 transition-colors">"More"</a> page.</>}
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={async () => {
                if (!accountInput.trim()) {
                  setErrorMessage(
                    language === 'zh'
                      ? '請輸入帳號或上傳截圖'
                      : 'Please enter your account or upload a screenshot'
                  );
                  return;
                }

                setIsLoadingData(true);
                setErrorMessage(null);

                if (onLoadUserData) {
                  const success = await onLoadUserData(accountInput.trim());
                  if (!success) {
                    // 錯誤訊息已經在 onLoadUserData 中設定
                  }
                }

                setIsLoadingData(false);
              }}
              disabled={isRecognizing || isLoadingData}
              className={`w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-2xl shadow-black/20 hover:bg-white/95 transition-all ${
                (isRecognizing || isLoadingData) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {(isRecognizing || isLoadingData)
                ? (language === 'zh' ? '載入中...' : 'Loading...')
                : (language === 'zh' ? '查看我的年度回顾' : 'See My Wrap')
              }
            </button>
            <button 
              onClick={() => window.open('https://www.cmoney.tw/r/236/np8nqw', '_blank')}
              className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-6 py-3 font-['Inter','Noto_Sans_SC'] font-semibold text-[15px] hover:bg-white/15 transition-all">
              {language === 'zh' ? '返回麦克APP' : 'Back to Mike App'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen2({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const wrapData = mapUserDataToWrapData(userData);
  const { days_with_mike } = wrapData;

  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-[#5B16D6]" data-name="Welcome">
      {/* Original textured background layer */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-25" src={imgLoginBackground} />
      
      {/* New purple gradient wave layer */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-35" src={imgEvolutionBackground} />
      
      {/* Purple overlay blend layer for cohesion */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/25 via-transparent to-[#5B16D6]/15 mix-blend-overlay" />
      
      {/* Additional depth layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      {/* Massive number that breaks boundaries */}
      <div className="absolute top-[200px] left-[-20px] right-[-20px]">
        <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[180px] leading-[0.85] tracking-[-0.04em] text-center">
          {days_with_mike}
        </h1>
      </div>
      
      {/* Text overlaying the number */}
      <div className="absolute top-[160px] left-0 right-0 px-10">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[18px] leading-[1.3] text-center">
          {language === 'zh' ? '与麦克同行的日子' : 'DAYS WITH MIKE'}
        </p>
      </div>
      
      <div className="absolute bottom-[180px] left-0 right-0 px-10">
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/60 text-[15px] leading-[1.5] text-center">
          {language === 'zh'
            ? '感谢你在 2025 与 Mike 并肩，很高兴能见证你的每一次跃升'
            : 'Thank you for walking alongside Mike in 2025.\nWe\'re grateful to witness every step of your growth.'}
        </p>
      </div>
    </div>
  );
}

function Screen3({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const wrapData = mapUserDataToWrapData(userData);
  const { active_days, days_with_mike, login_percentage, active_days_level_grade } = wrapData;

  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" data-name="Days Logged">
      {/* Wave background with purple tinting */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-40" src={imgUserTypeBackground} />
      
      {/* Purple overlay blend layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/30 via-transparent to-[#5B16D6]/20 mix-blend-overlay" />
      
      {/* Additional depth layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      {/* Diagonal composition */}
      <div className="absolute top-[120px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[16px] leading-[1.3] tracking-[0.05em] uppercase mb-3">
          {language === 'zh' ? '活跃天数' : 'Active Days'}
        </p>
        <div className="h-[1px] w-16 bg-white/40" />
      </div>
      
      <div className="absolute top-[220px] left-0 right-0">
        <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[180px] leading-[0.85] tracking-[-0.04em] text-center">
          {active_days}
        </h1>
      </div>
      
      <div className="absolute top-[420px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[15px] leading-[1.5]">
          {language === 'zh' 
            ? `在 ${days_with_mike} 天里，你登录了` 
            : `Out of ${days_with_mike} days, you logged in`}
        </p>
        <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[28px] leading-[1.2] mt-2">
          {login_percentage}% {language === 'zh' ? '的时间' : 'of the time'}
        </p>
      </div>
      
      {/* Conditional rendering based on active_days_level_grade */}
      <div className="absolute bottom-[120px] left-8 right-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        {active_days_level_grade === 1 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[1] mb-3">
              {language === 'zh' ? '前 5%' : 'Top 5%'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[14px] leading-[1.5]">
              {language === 'zh' 
                ? '你已跻身 Mike 最核心的用户行列。\n当大多数人还在观望时，你早已掌握第一手观点，在市场波动中保持清晰节奏。' 
                : "You're among the most dedicated Mike users.\nWhile others react, you're already positioned — catching Mike's insights early and staying calm through market swings."}
            </p>
          </>
        )}
        {active_days_level_grade === 2 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[1] mb-3">
              {language === 'zh' ? '前 20%' : 'Top 20%'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[14px] leading-[1.5]">
              {language === 'zh' 
                ? '你的持续投入，正在拉开你与多数用户的差距。\n比起大多数人，你更早理解 Mike 的判断，也更从容面对市场变化。' 
                : "You show up consistently — and it shows.\nYou stay closer to Mike's thinking than most, building clarity and confidence before the market moves."}
            </p>
          </>
        )}
        {active_days_level_grade === 3 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[1] mb-3">
              {language === 'zh' ? '前 30%' : 'Top 30%'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[14px] leading-[1.5]">
              {language === 'zh' 
                ? '你已经建立了稳定使用 Mike 的习惯。\n这份持续积累，正在帮助你更清楚地看懂市场，做出更有方向感的决策。' 
                : "You've built a strong habit of staying connected.\nOver time, this consistency helps you see the market more clearly — and act with intention."}
            </p>
          </>
        )}
        {active_days_level_grade === 4 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[28px] leading-[1.2] mb-3">
              {language === 'zh' ? '每一段成长，都是从这里开始。' : 'Every journey starts somewhere.'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[14px] leading-[1.5]">
              {language === 'zh' 
                ? '很高兴你选择了 Mike，期待未来与你一起进步、一起变强。' 
                : "We're glad to have you here — and excited to grow stronger together from here on."}
            </p>
          </>
        )}
        {active_days_level_grade === 5 && (
          <>
            <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[28px] leading-[1.2] mb-3">
              {language === 'zh' ? '感谢你持续陪伴 Mike。' : 'Thank you for staying with Mike.'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[14px] leading-[1.5]">
              {language === 'zh' 
                ? '稳定的支持同样重要，期待未来与你一起走得更远。' 
                : "Your steady presence matters — and we're looking forward to building even more together."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Screen4({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  // 從 userData 取得資料，如果沒有則使用預設值
  const user_type = userData?.usertype || 2; // 1 or 2
  
  // 從 userData 取得功能名稱和 VIP 狀態，如果沒有則使用預設值
  const feature_1 = userData?.feature_1 || "語音聊天室 live room";
  const feature_2 = userData?.feature_2 || "麥克精選 mike's pick";
  const feature_3 = userData?.feature_3 || "俱樂部 club";
  const feature_4 = userData?.feature_4 || "麥克交易 mike's trade";
  const feature_5 = userData?.feature_5 || "影片 video";
  
  // VIP status (1 = VIP, 2 = non-VIP)
  const feature_1_vip = userData?.feature_1_vip ?? 1;
  const feature_2_vip = userData?.feature_2_vip ?? 1;
  const feature_3_vip = userData?.feature_3_vip ?? 2;
  const feature_4_vip = userData?.feature_4_vip ?? 1;
  const feature_5_vip = userData?.feature_5_vip ?? 2;
  
  // Build features array based on user_type
  const allFeatures = [
    { rank: '01', name: feature_1, isVIP: feature_1_vip === 1, opacity: 'bg-white/25', glow: 'shadow-[0_0_30px_rgba(255,255,255,0.2)]' },
    { rank: '02', name: feature_2, isVIP: feature_2_vip === 1, opacity: 'bg-white/20', glow: 'shadow-[0_0_20px_rgba(255,255,255,0.15)]' },
    { rank: '03', name: feature_3, isVIP: feature_3_vip === 1, opacity: 'bg-white/17', glow: '' },
    { rank: '04', name: feature_4, isVIP: feature_4_vip === 1, opacity: 'bg-white/14', glow: '' },
    { rank: '05', name: feature_5, isVIP: feature_5_vip === 1, opacity: 'bg-white/11', glow: '' },
  ];
  
  // Show only 3 features if user_type = 1, otherwise show all 5
  const features = user_type === 1 ? allFeatures.slice(0, 3) : allFeatures;
  
  // Check if any feature is VIP
  const hasVIPFeatures = [feature_1_vip, feature_2_vip, feature_3_vip, feature_4_vip, feature_5_vip].includes(1);

  // Helper function to split bilingual feature names
  const splitFeatureName = (name: string) => {
    // 匹配中文字符（包括中文標點）
    const chineseMatch = name.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
    
    // 先移除所有中文字符，得到純英文部分
    const englishOnly = name.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, '').trim();
    
    // 將英文部分按空格分割成單詞
    const englishWords = englishOnly ? englishOnly.split(/\s+/).filter(w => w.length > 0) : [];
    
    let chinese = chineseMatch ? chineseMatch.join('') : '';
    let english = '';
    
    if (englishWords.length > 0) {
      // 檢查第一個英文單詞是否是短縮寫（2-4個大寫字母，如 ETF）
      const firstWord = englishWords[0];
      const isShortAbbreviation = /^[A-Z]{2,4}$/.test(firstWord);
      
      if (isShortAbbreviation && englishWords.length > 1) {
        // 將短縮寫加入中文部分
        chinese = chinese + ' ' + firstWord;
        // 英文部分取剩餘的所有單詞（從第二個開始）
        english = englishWords.slice(1).join(' ');
      } else {
        // 否則，所有英文單詞都作為英文部分
        english = englishWords.join(' ');
      }
    }
    
    return {
      chinese: chinese.trim(),
      english: english.trim()
    };
  };

  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-[#5B16D6]" data-name="Top Functions">
      {/* Dark architectural gradient background - PRIMARY layer */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-70" src={imgMikeTradeBackground} />
      
      {/* Purple color overlay - shifts dark tones to purple */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/50 via-[#5B16D6]/40 to-[#4A0FB8]/50 mix-blend-color" />
      
      {/* Purple multiply layer - deepens the purple saturation */}
      <div className="absolute inset-0 bg-[#5B16D6]/30 mix-blend-multiply" />
      
      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      
      {/* Top gradient fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      <div className="absolute top-[80px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/60 text-[14px] leading-[1.3] tracking-[0.1em] uppercase mb-2">
          {language === 'zh' ? `你的前 ${user_type === 1 ? '3' : '5'} 名` : `Your Top ${user_type === 1 ? '3' : '5'}`}
        </p>
        <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] leading-[1] tracking-[-0.02em]">
          {language === 'zh' ? '最常使用的\n功能' : 'Most Used\nFeatures'}
        </h2>
      </div>
      
      {/* Feature ranking list - refined layout */}
      <div className={`absolute top-[240px] left-8 right-8 ${user_type === 1 ? 'space-y-5' : 'space-y-3.5'}`}>
        {features.map((feature, index) => {
          const { chinese, english } = splitFeatureName(feature.name);
          
          // Height-driven hierarchy system
          const getBarHeight = () => {
            if (user_type === 1) {
              // Top 3 layout - strong height contrast to show clear ranking
              switch(index) {
                case 0: return 'h-[150px]'; // Top 1: Dominant
                case 1: return 'h-[110px]'; // Top 2: Noticeably shorter
                case 2: return 'h-[80px]'; // Top 3: Smallest but substantial
                default: return 'h-[80px]';
              }
            }
            // Top 5 layout - original heights
            switch(index) {
              case 0: return 'h-[84px]'; // Top 1: Hero
              case 1: return 'h-[72px]'; // Top 2
              case 2: return 'h-[64px]'; // Top 3
              case 3: return 'h-[56px]'; // Top 4
              case 4: return 'h-[48px]'; // Top 5: Minimum, readable
              default: return 'h-[64px]';
            }
          };
          
          // Rank number scales proportionally with bar height (60-70% of bar height)
          const getRankNumberSize = () => {
            if (user_type === 1) {
              // Top 3 layout - sized to fit container for single digit
              switch(index) {
                case 0: return 'text-[80px]'; // Top 1
                case 1: return 'text-[64px]'; // Top 2
                case 2: return 'text-[48px]'; // Top 3
                default: return 'text-[48px]';
              }
            }
            // Top 5 layout - original sizes
            switch(index) {
              case 0: return 'text-[56px]'; // Top 1: ~67% of 84px
              case 1: return 'text-[48px]'; // Top 2: ~67% of 72px
              case 2: return 'text-[42px]'; // Top 3: ~66% of 64px
              case 3: return 'text-[36px]'; // Top 4: ~64% of 56px
              case 4: return 'text-[32px]'; // Top 5: ~67% of 48px
              default: return 'text-[42px]';
            }
          };
          
          // Typography scales proportionally with bar height
          const getChineseFontSize = () => {
            if (user_type === 1) {
              // Top 3 layout - slightly reduced to ensure single-line fit
              switch(index) {
                case 0: return 'text-[30px]'; // Top 1: Reduced from 34px for single-line guarantee
                case 1: return 'text-[24px]'; // Top 2: Slightly smaller
                case 2: return 'text-[18px]'; // Top 3: Smaller but readable
                default: return 'text-[18px]';
              }
            }
            // Top 5 layout - original sizes
            switch(index) {
              case 0: return 'text-[20px]'; // Top 1: Largest
              case 1: return 'text-[18px]'; // Top 2
              case 2: return 'text-[17px]'; // Top 3
              case 3: return 'text-[16px]'; // Top 4
              case 4: return 'text-[15px]'; // Top 5: Smallest but readable
              default: return 'text-[17px]';
            }
          };
          
          const getEnglishFontSize = () => {
            if (user_type === 1) {
              // Top 3 layout - scaled with Chinese text adjustments
              switch(index) {
                case 0: return 'text-[18px]'; // Top 1: Proportional to 30px
                case 1: return 'text-[15px]'; // Top 2: Proportional to 24px
                case 2: return 'text-[12px]'; // Top 3: Proportional to 18px
                default: return 'text-[12px]';
              }
            }
            // Top 5 layout - original sizes
            switch(index) {
              case 0: return 'text-[14px]'; // Top 1
              case 1: return 'text-[13px]'; // Top 2
              case 2: return 'text-[12.5px]'; // Top 3
              case 3: return 'text-[12px]'; // Top 4
              case 4: return 'text-[11px]'; // Top 5
              default: return 'text-[12.5px]';
            }
          };
          
          // Crown icon size - subtle scaling for Top 3
          const getCrownSize = () => {
            if (user_type === 1) {
              switch(index) {
                case 0: return 24; // Top 1: Slightly larger
                case 1: return 22; // Top 2: Medium
                case 2: return 20; // Top 3: Standard
                default: return 20;
              }
            }
            return 20; // Top 5: Consistent size
          };
          
          // Border radius - rounded rectangle for Top 3, full pill for Top 5
          const getBorderRadius = () => {
            return user_type === 1 ? 'rounded-2xl' : 'rounded-full';
          };
          
          // Horizontal gap between number and bar - tighter for Top 3 to create compact flow
          const getGap = () => {
            return user_type === 1 ? 'gap-2' : 'gap-4';
          };
          
          // Container width - narrower for Top 3 to give bars more width
          const getNumberContainerWidth = () => {
            return user_type === 1 ? 'w-16' : 'w-14';
          };
          
          // Number alignment - left-aligned for Top 3, centered for Top 5
          const getNumberAlignment = () => {
            return user_type === 1 ? 'justify-start' : 'justify-center';
          };
          
          // Display rank number - strip leading zero for Top 3
          const displayRank = user_type === 1 ? String(index + 1) : feature.rank;
          
          return (
            <div key={index} className={`relative flex items-center ${getGap()}`}>
              {/* Rank number - left-aligned for Top 3, centered for Top 5 */}
              <div className={`flex-shrink-0 ${getNumberContainerWidth()} flex items-center ${getNumberAlignment()}`}>
                <span className={`font-['Space_Grotesk','Noto_Sans_SC'] font-normal text-white/80 ${getRankNumberSize()} leading-[1]`}>
                  {displayRank}
                </span>
              </div>
              
              {/* Premium glassmorphism bar - rounded rectangle for Top 3, pill for Top 5 */}
              <div className="flex-1">
                <div 
                  className={`${getBarHeight()} bg-white/15 backdrop-blur-xl ${getBorderRadius()} flex items-center justify-between px-6 shadow-lg shadow-black/10 border border-white/40 relative overflow-hidden`}
                >
                  {/* Glass highlight - top edge shimmer */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  
                  {/* Subtle inner glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent ${getBorderRadius()}`} />
                  
                  {/* Feature name - two-line layout with no-wrap Chinese text for Top 3 */}
                  <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center relative z-10">
                    {/* Chinese - top line, no-wrap for Top 3 to prevent line breaks */}
                    <p className={`font-['Inter','Noto_Sans_SC'] font-semibold text-white leading-[1.2] tracking-[0.01em] ${getChineseFontSize()} ${user_type === 1 ? 'whitespace-nowrap' : ''} drop-shadow-sm`}>
                      {chinese}
                    </p>
                    {/* English - bottom line */}
                    <p className={`font-['Inter','Noto_Sans_SC'] font-normal text-white/80 leading-[1.2] tracking-[0.02em] mt-1 ${getEnglishFontSize()} drop-shadow-sm`}>
                      {english}
                    </p>
                  </div>
                  
                  {/* VIP crown icon - subtle size scaling for Top 3 */}
                  {feature.isVIP && (
                    <div className="flex-shrink-0 relative z-10">
                      <Crown 
                        className="text-white drop-shadow-md" 
                        size={getCrownSize()} 
                        strokeWidth={2.5}
                        fill="currentColor"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* VIP Features summary module - positioned relative to feature list end */}
      {hasVIPFeatures && (
        <div className={`absolute left-8 right-8 ${user_type === 1 ? 'top-[660px]' : 'top-[665px]'}`}>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="text-white" size={20} strokeWidth={2} fill="currentColor" />
              <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[13px] uppercase tracking-wide">
                {language === 'zh' ? 'VIP 功能' : 'VIP Features'}
              </p>
            </div>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[13px] leading-[1.5]">
              {language === 'zh' 
                ? '你最常使用的都是高级功能 —— 真正的资深用户' 
                : 'You engaged most with premium features — a true power user'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Screen5({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-[#5B16D6]" data-name="Product Evolution">
      {/* Original textured background layer */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-25" src={imgLoginBackground} />
      
      {/* New purple gradient wave layer */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-35" src={imgEvolutionBackground} />
      
      {/* Purple overlay blend layer for cohesion */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/25 via-transparent to-[#5B16D6]/15 mix-blend-overlay" />
      
      {/* Additional depth layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      <div className="absolute top-[70px] left-8 right-8">
        <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[36px] leading-[1] tracking-[-0.02em]">
          {language === 'zh' ? '陪你变强的路上，Mike App 也不断在进化' : 'As you grow stronger, Mike App grows with you'}
        </h2>
      </div>
      
      {/* Vertical Timeline - compact early milestones, heavier November */}
      <div className="absolute top-[220px] left-8 right-8 pb-4">
        {/* Timeline vertical line */}
        <div className="absolute left-[22px] top-[24px] w-[2px] h-[420px] bg-gradient-to-b from-white/30 via-white/20 to-white/10" />
        
        {/* Milestone 1: March - Chat Room */}
        <div className="relative pl-16 mb-4">
          <div className="absolute left-0 top-0">
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 flex items-center justify-center">
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[13px]">
                MAR
              </p>
            </div>
          </div>
          
          <div className="bg-white/12 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/25 shadow-xl shadow-black/10">
            <div className="relative h-[115px] overflow-hidden">
              <img 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-65"
                src={imgChatRoom}
                style={{ transform: 'scale(1.15)' }}
              />
              {/* Depth layer - creates darkness from bottom to top */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              {/* Subtle purple tint layer */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#5B16D6]/40 via-[#5B16D6]/20 to-transparent" />
              
              <div className="absolute bottom-3.5 left-4 right-4">
                <h3 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[24px] leading-[1.1] tracking-[-0.02em] mb-1.5">
                  {language === 'zh' ? '文字聊天室' : 'Chat Room'}
                </h3>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[12px] leading-[1.4]">
                  {language === 'zh' ? '连接、讨论、与他人一起成长' : 'Connect, discuss, and grow with others.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Milestone 2: August - Investment Journal */}
        <div className="relative pl-16 mb-4">
          <div className="absolute left-0 top-0">
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-lg border-2 border-white/30 flex items-center justify-center">
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[13px]">
                AUG
              </p>
            </div>
          </div>
          
          <div className="bg-white/12 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/25 shadow-xl shadow-black/10">
            <div className="relative h-[115px] overflow-hidden">
              <img 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-65"
                src={imgMikeTrade}
                style={{ transform: 'scale(1.15)' }}
              />
              {/* Depth layer - creates darkness from bottom to top */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              {/* Subtle purple tint layer */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#5B16D6]/40 via-[#5B16D6]/20 to-transparent" />
              
              <div className="absolute bottom-3.5 left-4 right-4">
                <h3 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[24px] leading-[1.1] tracking-[-0.02em] mb-1.5">
                  {language === 'zh' ? '投资日誌' : 'Investment Journal'}
                </h3>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[12px] leading-[1.4]">
                  {language === 'zh' ? '记录决策、回顾逻辑、培养更好的习惯' : 'Record decisions, review logic, and build better habits.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Milestone 3: November - Home Page & Live Room (MAJOR - heavier visual weight) */}
        <div className="relative pl-16">
          <div className="absolute left-0 top-0">
            <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-lg border-2 border-white/60 flex items-center justify-center shadow-lg shadow-white/20">
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[13px]">
                NOV
              </p>
            </div>
          </div>
          
          <div className="bg-white/12 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/25 shadow-xl shadow-black/10">
            <div className="relative h-[180px] overflow-hidden">
              <img 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-65"
                src={imgLiveRoom}
                style={{ transform: 'scale(1.15)' }}
              />
              {/* Depth layer - creates darkness from bottom to top */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              {/* Subtle purple tint layer */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#5B16D6]/40 via-[#5B16D6]/20 to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5">
                <h3 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[28px] leading-[1.1] tracking-[-0.02em] mb-3">
                  {language === 'zh' ? '首页&语音聊天室' : 'Home Page &\nLive Room'}
                </h3>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[13px] leading-[1.5]">
                  {language === 'zh' ? '更快地探索 —— 以及全新的实时学习方式' : 'Explore faster — plus a new way to learn together in real time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emotional conclusion - simplified text paragraph */}
      <div className="absolute bottom-[70px] left-8 right-8 text-center">
        <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-medium text-white/80 text-[16px] leading-[1.3] tracking-[-0.01em]">
          {language === 'zh' ? (
            <>一步一步，麦克与你一起成长。<br />—— 2026 年，我们将继续创造更多。</>
          ) : (
            <>Step by step, Mike grew with you.<br />— and in 2026, we'll keep building even more.</>
          )}
        </p>
      </div>
    </div>
  );
}

function Screen5a({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-[#5B16D6]" data-name="Portfolio Performance">
      {/* Dark architectural gradient background - PRIMARY layer */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-70" src={imgMikeTradeBackground} />
      
      {/* Purple color overlay - shifts dark tones to purple */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/50 via-[#5B16D6]/40 to-[#4A0FB8]/50 mix-blend-color" />
      
      {/* Purple multiply layer - deepens the purple saturation */}
      <div className="absolute inset-0 bg-[#5B16D6]/30 mix-blend-multiply" />
      
      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      
      {/* Top gradient fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      {/* Header section - aligned with other screens */}
      <div className="absolute top-[80px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/60 text-[14px] leading-[1.3] tracking-[0.1em] uppercase mb-2">
          {language === 'zh' ? '2025策略年度表现' : '2025 strategy performance'}
        </p>
        <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] leading-[1.1] tracking-[-0.02em]">
          {language === 'zh' ? '麦克精选' : "Mike's Pick"}
        </h2>
      </div>
      
      {/* Bento box container - unified stats layout */}
      <div className="absolute top-[200px] left-8 right-8 flex flex-col gap-3">
        {/* Hero stat - Total Return */}
        <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-8 border border-white/25 shadow-xl shadow-black/10">
          <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[13px] uppercase tracking-wide mb-3">
            {language === 'zh' ? '总收益' : 'Total Return'}
          </p>
          <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[96px] leading-[0.9] tracking-[-0.04em]">
            +42%
          </h1>
        </div>
        
        {/* Benchmark comparison card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[13px] uppercase tracking-wide mb-3">
            {language === 'zh' ? '对比基准' : 'vs Benchmark'}
          </p>
          <div className="flex items-center gap-3">
            <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.9] tracking-[-0.03em]">
              2.6×
            </p>
            <div>
              <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white text-[15px] leading-[1.3]">
                {language === 'zh' ? '优于' : 'better than'}
              </p>
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-semibold text-white text-[15px] leading-[1.3]">
                S&P 500 (+16%)
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats grid - two columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Doubled stocks */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
            <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.9] tracking-[-0.03em] mb-2">
              11
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/80 text-[13px] leading-[1.4]">
              {language === 'zh' ? '檔股票翻超過一倍' : 'stocks doubled'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[12px] mt-1">
              +100% {language === 'zh' ? '或更多' : 'or more'}
            </p>
          </div>
          
          {/* Tripled stocks */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
            <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] leading-[0.9] tracking-[-0.03em] mb-2">
              6
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/80 text-[13px] leading-[1.4]">
              {language === 'zh' ? '檔股票翻超過兩倍' : 'stocks tripled'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[12px] mt-1">
              +200% {language === 'zh' ? '或更多' : 'or more'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen8({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Mike Type variable - set to 1, 2, 3, or 4
  const mike_type = userData?.mike_type || 3;
  // User type variable - set to 1 or 2
  const user_type = userData?.usertype || 2;
  
  // Content mapping based on mike_type
  const getMikeTypeContent = () => {
    switch(mike_type) {
      case 1:
        return {
          title: language === 'zh' ? "社群\n连接者" : "Community\nConnector",
          description: language === 'zh' 
            ? "你擅长借力集体的智慧，在共鸣中寻找答案" 
            : "You grow faster when you learn with others.",
          subtitle: language === 'zh'
            ? "你擅长借力集体的智慧，在共鸣中寻找答案，将众人的灵感内化为自己的决策。这种对信息流的敏锐捕捉，让你在市场中不再是孤军奋战。"
            : "Perspective is your real advantage."
        };
      case 2:
        return {
          title: language === 'zh' ? "信号\n狙击手" : "Signal\nHunter",
          description: language === 'zh'
            ? "你不为噪音所动，只在信号明确的瞬间果断出手"
            : "You move when timing matters.",
          subtitle: language === 'zh'
            ? "你不为噪音所动，只在信号明确的瞬间果断出手。这种不轻易出鞘的克制，让你总能踩准市场的节拍。在波动的环境中，这份定力是你最强大的武器。"
            : "Signals guide your decisions."
        };
      case 3:
        return {
          title: language === 'zh' ? "情报\n分析师" : "Insight\nCollector",
          description: language === 'zh'
            ? "你在事件背后的底层逻辑中寻找答案"
            : "You look for the 'why' behind every move.",
          subtitle: language === 'zh'
            ? "你在事件背后的底层逻辑中寻找答案。这种稳扎稳打的风格，让你在面对波动时比别人多了一份从容。你构建优势的方式，是让每一笔决策都有据可依。"
            : "Understanding comes before action."
        };
      case 4:
        return {
          title: language === 'zh' ? "系统\n架构师" : "System\nCrafter",
          description: language === 'zh'
            ? "你深知，一套成熟的体系远比运气更重要"
            : "You turn ideas into repeatable decisions.",
          subtitle: language === 'zh'
            ? "你深知，一套成熟的体系远比运气更重要。你习惯将复杂的操作磨炼成可重复的纪律，就算市场震荡，你的动作依然有章法。"
            : "Process keeps you sharp."
        };
      default:
        return {
          title: language === 'zh' ? "社群\n连接者" : "Community\nConnector",
          description: language === 'zh'
            ? "你擅长借力集体的智慧，在共鸣中寻找答案"
            : "You grow faster when you learn with others.",
          subtitle: language === 'zh'
            ? "你擅长借力集体的智慧，在共鸣中寻找答案，将众人的灵感内化为自己的决策。这种对信息流的敏锐捕捉，让你在市场中不再是孤军奋战。"
            : "Perspective is your real advantage."
        };
    }
  };
  
  const content = getMikeTypeContent();
  
  // Icon component - customize based on your needs
  const getTypeIcon = () => {
    // Default icon - conversation nodes
    return (
      <svg className="absolute top-[140px] left-1/2 -translate-x-1/2 w-[280px] h-[280px] opacity-20" viewBox="0 0 280 280" fill="none">
        <circle cx="70" cy="70" r="30" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1" />
        <circle cx="210" cy="70" r="30" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1" />
        <circle cx="140" cy="180" r="35" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.15" />
        <circle cx="50" cy="210" r="25" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1" />
        <circle cx="230" cy="210" r="25" stroke="white" strokeWidth="4" fill="white" fillOpacity="0.1" />
        <line x1="85" y1="85" x2="125" y2="165" stroke="white" strokeWidth="3" opacity="0.4" />
        <line x1="195" y1="85" x2="155" y2="165" stroke="white" strokeWidth="3" opacity="0.4" />
        <line x1="115" y1="195" x2="70" y2="200" stroke="white" strokeWidth="3" opacity="0.4" />
        <line x1="165" y1="195" x2="210" y2="200" stroke="white" strokeWidth="3" opacity="0.4" />
      </svg>
    );
  };
  
  // Current user type index for cycling through types
  const [currentUserType, setCurrentUserType] = useState(0);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      setBgImageLoaded(true);
    };
    img.onerror = () => {
      console.warn('Failed to load background image');
      setBgImageLoaded(true); // Still set to true to allow rendering without background
    };
    img.src = imgUserTypeBackground;
  }, []);

  // Check if fonts are loaded
  const checkFontsLoaded = async (): Promise<boolean> => {
    try {
      await document.fonts.ready;
      // Wait a bit more to ensure fonts are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check specific fonts with actual font names used
      const spaceGroteskLoaded = document.fonts.check('bold 48px "Space Grotesk"') || 
                                 document.fonts.check('bold 48px Space Grotesk');
      const interLoaded = document.fonts.check('normal 16px "Inter"') || 
                         document.fonts.check('normal 16px Inter');
      const notoSansLoaded = document.fonts.check('normal 16px "Noto Sans SC"') || 
                            document.fonts.check('normal 16px "Noto Sans SC"');
      
      // If fonts are not loaded, wait a bit more
      if (!spaceGroteskLoaded || !interLoaded || !notoSansLoaded) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return (document.fonts.check('bold 48px "Space Grotesk"') || 
                document.fonts.check('bold 48px Space Grotesk')) && 
               (document.fonts.check('normal 16px "Inter"') || 
                document.fonts.check('normal 16px Inter')) &&
               (document.fonts.check('normal 16px "Noto Sans SC"') || 
                document.fonts.check('normal 16px "Noto Sans SC"'));
      }
      return true;
    } catch (error) {
      console.warn('Font loading check failed:', error);
      return true; // Proceed anyway
    }
  };

  // Render SVG icon to canvas
  const drawIconToCanvas = (ctx: CanvasRenderingContext2D) => {
    const centerX = 195; // 390 / 2
    const iconY = 140;
    const iconSize = 280;
    const scale = 1;

    ctx.save();
    ctx.translate(centerX, iconY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.2;

    // Draw circles
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4 * scale;
    
    // Circle 1: cx="70" cy="70" r="30"
    ctx.beginPath();
    ctx.arc(70 - 140, 70, 30 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circle 2: cx="210" cy="70" r="30"
    ctx.beginPath();
    ctx.arc(210 - 140, 70, 30 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circle 3: cx="140" cy="180" r="35"
    ctx.beginPath();
    ctx.arc(140 - 140, 180, 35 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.stroke();

    // Circle 4: cx="50" cy="210" r="25"
    ctx.beginPath();
    ctx.arc(50 - 140, 210, 25 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.stroke();

    // Circle 5: cx="230" cy="210" r="25"
    ctx.beginPath();
    ctx.arc(230 - 140, 210, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw lines
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 3 * scale;
    
    // Line 1: x1="85" y1="85" x2="125" y2="165"
    ctx.beginPath();
    ctx.moveTo(85 - 140, 85);
    ctx.lineTo(125 - 140, 165);
    ctx.stroke();

    // Line 2: x1="195" y1="85" x2="155" y2="165"
    ctx.beginPath();
    ctx.moveTo(195 - 140, 85);
    ctx.lineTo(155 - 140, 165);
    ctx.stroke();

    // Line 3: x1="115" y1="195" x2="70" y2="200"
    ctx.beginPath();
    ctx.moveTo(115 - 140, 195);
    ctx.lineTo(70 - 140, 200);
    ctx.stroke();

    // Line 4: x1="165" y1="195" x2="210" y2="200"
    ctx.beginPath();
    ctx.moveTo(165 - 140, 195);
    ctx.lineTo(210 - 140, 200);
    ctx.stroke();

    ctx.restore();
  };

  // Render content to canvas
  const renderToCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Wait for fonts and background image
      const fontsReady = await checkFontsLoaded();
      if (!fontsReady && bgImageLoaded === false) {
        // Wait a bit more if not ready
        setTimeout(() => renderToCanvas(), 100);
        return;
      }

      const pixelRatio = 2;
      const width = 390;
      const height = 844;

      // Set canvas size first (this clears the canvas automatically)
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Get context after resizing (context properties are reset when canvas size changes)
      const ctx = canvas.getContext('2d', { 
        willReadFrequently: false,
        alpha: true 
      });
      if (!ctx) return;
      
      // Clear canvas completely to ensure no artifacts
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale context for high DPI
      ctx.scale(pixelRatio, pixelRatio);
      
      // Ensure clean rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Draw background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#7B3FE4');
      bgGradient.addColorStop(0.5, '#5B16D6');
      bgGradient.addColorStop(1, '#4A0FB8');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw background image if loaded (using object-cover object-center logic)
      if (bgImageRef.current && bgImageLoaded) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        
        const img = bgImageRef.current;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const canvasAspect = width / height;
        const imgAspect = imgWidth / imgHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        // object-cover: scale to cover entire area, maintain aspect ratio
        if (imgAspect > canvasAspect) {
          // Image is wider, fit to height
          drawHeight = height;
          drawWidth = height * imgAspect;
          drawX = (width - drawWidth) / 2; // object-center: center horizontally
          drawY = 0;
        } else {
          // Image is taller, fit to width
          drawWidth = width;
          drawHeight = width / imgAspect;
          drawX = 0;
          drawY = (height - drawHeight) / 2; // object-center: center vertically
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }

      // 3. Draw purple overlay blend layer
      ctx.save();
      const overlayGradient = ctx.createLinearGradient(0, 0, width, height);
      overlayGradient.addColorStop(0, 'rgba(91, 22, 214, 0.3)');
      overlayGradient.addColorStop(0.5, 'transparent');
      overlayGradient.addColorStop(1, 'rgba(91, 22, 214, 0.2)');
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 4. Draw additional depth layer
      ctx.save();
      const depthGradient = ctx.createLinearGradient(0, height, 0, 0);
      depthGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      depthGradient.addColorStop(0.5, 'transparent');
      depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      ctx.fillStyle = depthGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 5. Draw icon
      drawIconToCanvas(ctx);

      // 6. Draw text content
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Get current content (recalculate to ensure latest values)
      const currentContent = getMikeTypeContent();

      // Top header - small label (left-8 right-8 = 32px padding each side)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 12px "Inter", "Noto Sans SC"';
      ctx.letterSpacing = '0.2em';
      const headerText = language === 'zh' ? '你的麦克类型' : 'Your Mike Type';
      ctx.fillText(headerText.toUpperCase(), width / 2, 80);

      // Main statement (left-8 right-8 = 32px padding each side, so max width is 390 - 64 = 326px)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'normal 16px "Inter", "Noto Sans SC"';
      ctx.letterSpacing = 'normal';
      const statementText = language === 'zh' ? '分析你的活动后，你是一位…' : "After analyzing your activity, you're a…";
      const statementMaxWidth = width - 64; // left-8 right-8 = 32px each side
      const statementMetrics = ctx.measureText(statementText);
      if (statementMetrics.width > statementMaxWidth) {
        // Need to wrap text
        const words = statementText.split(' ');
        let currentLine = '';
        let y = 115;
        words.forEach((word) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > statementMaxWidth && currentLine) {
            ctx.fillText(currentLine, width / 2, y);
            currentLine = word;
            y += 24; // leading-[1.5] * 16px
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          ctx.fillText(currentLine, width / 2, y);
        }
      } else {
        ctx.fillText(statementText, width / 2, 115);
      }

      // User type name - VERY LARGE (left-8 right-8 + px-4 = 32px + 16px = 48px padding each side)
      ctx.fillStyle = 'white';
      ctx.font = `bold 48px "Space Grotesk", "Noto Sans SC"`;
      ctx.letterSpacing = '-0.03em';
      const titleLines = currentContent.title.split('\n');
      const titleY = 300;
      const lineHeight = language === 'zh' ? 72 : 45.6; // leading-[1.5] vs leading-[0.95]
      titleLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, titleY + (index * lineHeight));
      });

      // Tagline (only for English) (left-8 right-8 + px-4 = 48px padding each side, so max width is 390 - 96 = 294px)
      if (language !== 'zh') {
        ctx.fillStyle = 'white';
        ctx.font = '600 20px "Inter", "Noto Sans SC"';
        ctx.letterSpacing = '-0.01em';
        const taglineMaxWidth = width - 96; // left-8 right-8 + px-4 = 32 + 16 = 48px each side
        const taglineText = currentContent.description;
        const taglineMetrics = ctx.measureText(taglineText);
        if (taglineMetrics.width > taglineMaxWidth) {
          // Need to wrap text
          const words = taglineText.split(' ');
          let currentLine = '';
          let y = 450;
          words.forEach((word) => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > taglineMaxWidth && currentLine) {
              ctx.fillText(currentLine, width / 2, y);
              currentLine = word;
              y += 26; // leading-[1.3] * 20px
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) {
            ctx.fillText(currentLine, width / 2, y);
          }
        } else {
          ctx.fillText(taglineText, width / 2, 450);
        }
      }

      // Description (left-10 right-10 = 40px padding, max-w-[300px] mx-auto, so centered with 300px width)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'normal 15px "Inter", "Noto Sans SC"';
      ctx.letterSpacing = 'normal';
      const descY = language === 'zh' ? 480 : 550;
      const descMaxWidth = 300; // max-w-[300px]
      const descLines = currentContent.subtitle.split('\n');
      const descLineHeight = 24; // leading-[1.6] * 15px
      
      // Helper function to wrap text (handles both Chinese and English)
      const wrapText = (text: string, maxWidth: number, startY: number) => {
        let y = startY;
        
        if (language === 'zh') {
          // Chinese: wrap by character
          let currentLine = '';
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              ctx.fillText(currentLine, width / 2, y);
              currentLine = char;
              y += descLineHeight;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            ctx.fillText(currentLine, width / 2, y);
          }
        } else {
          // English: wrap by word, but handle long words that exceed maxWidth
          const words = text.split(/\s+/).filter(w => w.length > 0); // Split by whitespace and filter empty
          let currentLine = '';
          words.forEach((word) => {
            // Check if single word exceeds maxWidth
            const wordMetrics = ctx.measureText(word);
            if (wordMetrics.width > maxWidth) {
              // If current line has content, render it first
              if (currentLine) {
                ctx.fillText(currentLine, width / 2, y);
                currentLine = '';
                y += descLineHeight;
              }
              // Break long word by character
              let wordLine = '';
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                const testWordLine = wordLine + char;
                const charMetrics = ctx.measureText(testWordLine);
                if (charMetrics.width > maxWidth && wordLine) {
                  ctx.fillText(wordLine, width / 2, y);
                  wordLine = char;
                  y += descLineHeight;
                } else {
                  wordLine = testWordLine;
                }
              }
              if (wordLine) {
                currentLine = wordLine;
              }
            } else {
              // Normal word wrapping
              const testLine = currentLine + (currentLine ? ' ' : '') + word;
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxWidth && currentLine) {
                ctx.fillText(currentLine, width / 2, y);
                currentLine = word;
                y += descLineHeight;
              } else {
                currentLine = testLine;
              }
            }
          });
          if (currentLine) {
            ctx.fillText(currentLine, width / 2, y);
          }
        }
        return y;
      };
      
      // Process each line separately (they are already split by \n in the content)
      // For English, the subtitle is usually a single line, so we need to handle it properly
      let currentY = descY;
      descLines.forEach((line, index) => {
        if (index > 0) {
          // Add spacing between paragraphs (only if not first line)
          currentY += descLineHeight;
        }
        // Wrap and render the line
        const endY = wrapText(line.trim(), descMaxWidth, currentY);
        // Move to next line position (add line height after rendering)
        currentY = endY + descLineHeight;
      });

      setCanvasReady(true);
    } catch (error) {
      console.error('Error rendering to canvas:', error);
      setCanvasReady(false);
    }
  };

  // Trigger canvas rendering when dependencies change
  useEffect(() => {
    if (bgImageLoaded) {
      renderToCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, mike_type, bgImageLoaded]);

  const handleSaveImage = async () => {
    const canvas = canvasRef.current;
    
    // Try to use canvas first (fast path)
    if (canvas && canvasReady) {
      try {
        // Create a new canvas to ensure clean export without any artifacts
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext('2d');
        if (exportCtx) {
          // Copy the rendered content to a fresh canvas
          exportCtx.drawImage(canvas, 0, 0);
          // Export from the clean canvas
          const dataUrl = exportCanvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = `mike-wrap-${language === 'zh' ? 'zh' : 'en'}.png`;
          link.href = dataUrl;
          // Remove any potential markers by using blob URL instead
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const blobUrl = URL.createObjectURL(blob);
              link.href = blobUrl;
              link.click();
              // Clean up blob URL after a delay
              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            })
            .catch(() => {
              // Fallback to direct data URL if blob fails
              link.click();
            });
        } else {
          // Fallback to direct export
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = `mike-wrap-${language === 'zh' ? 'zh' : 'en'}.png`;
          link.href = dataUrl;
          link.click();
        }
        return;
      } catch (error) {
        console.warn('Canvas export failed, falling back to toPng:', error);
      }
    }

    // Fallback to original toPng method
    if (screenRef.current) {
      try {
        const dataUrl = await toPng(screenRef.current, {
          backgroundColor: '#5B16D6',
          pixelRatio: 2,
          cacheBust: true,
          filter: (node) => {
            // Exclude nodes with data-exclude-from-capture attribute
            if (node instanceof HTMLElement) {
              return !node.hasAttribute('data-exclude-from-capture');
            }
            return true;
          },
        });
        
        const link = document.createElement('a');
        link.download = `mike-wrap-${language === 'zh' ? 'zh' : 'en'}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }
  };

  return (
    <div ref={screenRef} className="relative h-[844px] w-[390px] overflow-clip bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" data-name="User Type">
      {/* Hidden canvas for pre-rendering */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}
        aria-hidden="true"
      />
      
      {/* Wave background with purple tinting */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-40" src={imgUserTypeBackground} />
      
      {/* Purple overlay blend layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/30 via-transparent to-[#5B16D6]/20 mix-blend-overlay" />
      
      {/* Additional depth layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      {/* Top header - small label */}
      <div className="absolute top-[80px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/50 text-[12px] leading-[1.3] tracking-[0.2em] uppercase text-center">
          {language === 'zh' ? '你的麦克类型' : 'Your Mike Type'}
        </p>
      </div>
      
      {/* Main statement */}
      <div className="absolute top-[115px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[16px] leading-[1.5] text-center">
          {language === 'zh' ? '分析你的活动后，你是一位…' : "After analyzing your activity, you're a…"}
        </p>
      </div>
      
      {/* Icon - sits behind/near the type name */}
      {getTypeIcon()}
      
      {/* User type name - VERY LARGE and dominant */}
      <div className="absolute top-[300px] left-8 right-8">
        <h1 className={`font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] ${language === 'zh' ? 'leading-[1.5]' : 'leading-[0.95]'} tracking-[-0.03em] text-center whitespace-pre-line px-4 max-w-full`}>
          {content.title}
        </h1>
      </div>
      
      {/* Tagline - directly under name */}
      {language !== 'zh' && (
        <div className="absolute top-[450px] left-8 right-8 px-4">
          <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[20px] leading-[1.3] text-center tracking-[-0.01em]">
            {content.description}
          </p>
        </div>
      )}
      
      {/* Description - ONLY current type */}
      <div className={`absolute ${language === 'zh' ? 'top-[480px]' : 'top-[550px]'} left-10 right-10`}>
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/85 text-[15px] leading-[1.6] text-center whitespace-pre-line max-w-[300px] mx-auto">
          {content.subtitle}
        </p>
      </div>
      
      {/* Share button */}
      <div className="absolute bottom-[100px] left-8 right-8 space-y-3" data-exclude-from-capture="true">
        {/* Save Image button */}
        <button 
          onClick={handleSaveImage}
          className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-xl shadow-black/10 hover:bg-white/20 transition-all">
          {language === 'zh' ? '保存图片' : 'Save Image'}
        </button>
        
        {/* Share button */}
        <button 
          onClick={() => {
            // 根據 user_type 決定連結
            // user_type = 1 → https://www.cmoney.tw/r/236/2vltex
            // user_type = 2 → https://www.cmoney.tw/r/236/v6nu30
            const shareUrl = user_type === 1 
              ? 'https://www.cmoney.tw/r/236/2vltex' 
              : 'https://www.cmoney.tw/r/236/v6nu30';
            window.open(shareUrl, '_blank');
          }}
          className="w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-xl shadow-black/10 hover:bg-white/95 transition-all">
          {language === 'zh' ? '分享' : 'Share'}
        </button>
      </div>
    </div>
  );
}

function Screen9({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  // Premium user type: 1 or 2 (only shown when premium_user_type is 1 or 2)
  const premium_user_type = userData?.premium_user_type || 1;
  
  // Don't show Screen9 if premium_user_type is 3
  if (premium_user_type === 3) {
    return null;
  }
  
  // 從 userData 取得功能名稱和 VIP 狀態，如果沒有則使用預設值
  const feature_1 = userData?.feature_1 || "语音聊天室 Live Room";
  const feature_2 = userData?.feature_2 || "麦克精选 Mike's Pick";
  const feature_3 = userData?.feature_3 || "社团 Club";
  const feature_4 = userData?.feature_4 || "投资日誌 Mike's Investment Journal";
  const feature_5 = userData?.feature_5 || "内容专区影音 Video";
  
  // VIP status (1 = VIP, 2 = non-VIP)
  const feature_1_vip = userData?.feature_1_vip ?? 1;
  const feature_2_vip = userData?.feature_2_vip ?? 1;
  const feature_3_vip = userData?.feature_3_vip ?? 2;
  const feature_4_vip = userData?.feature_4_vip ?? 1;
  const feature_5_vip = userData?.feature_5_vip ?? 2;
  
  // Helper function to split bilingual feature names
  const splitFeatureName = (name: string) => {
    // 匹配中文字符（包括中文標點）
    const chineseMatch = name.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
    
    // 先移除所有中文字符，得到純英文部分
    const englishOnly = name.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g, '').trim();
    
    // 將英文部分按空格分割成單詞
    const englishWords = englishOnly ? englishOnly.split(/\s+/).filter(w => w.length > 0) : [];
    
    let chinese = chineseMatch ? chineseMatch.join('') : '';
    let english = '';
    
    if (englishWords.length > 0) {
      // 檢查第一個英文單詞是否是短縮寫（2-4個大寫字母，如 ETF）
      const firstWord = englishWords[0];
      const isShortAbbreviation = /^[A-Z]{2,4}$/.test(firstWord);
      
      if (isShortAbbreviation && englishWords.length > 1) {
        // 將短縮寫加入中文部分
        chinese = chinese + ' ' + firstWord;
        // 英文部分取剩餘的所有單詞（從第二個開始）
        english = englishWords.slice(1).join(' ');
      } else {
        // 否則，所有英文單詞都作為英文部分
        english = englishWords.join(' ');
      }
    }
    
    return {
      chinese: chinese.trim(),
      english: english.trim()
    };
  };
  
  // Get VIP features from Top 5
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
  
  // Content mapping based on premium_user_type
  const getPremiumContent = () => {
    if (premium_user_type === 1) {
      return {
        expiryDate: "Feb 4, 2026",
        price: "NT$469"
      };
    } else if (premium_user_type === 2) {
      return {
        expiryDate: "Feb 19, 2026",
        price: "NT$509"
      };
    }
    // Default fallback
    return {
      expiryDate: "Feb 4, 2026",
      price: "NT$469"
    };
  };
  
  const content = getPremiumContent();
  
  return (
    <div className="relative h-[844px] w-[390px] overflow-clip bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" data-name="Premium Reminder">
      {/* Soft background - using login background for consistency */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-30" src={imgLoginBackground} />
      
      {/* Gentle overlay - softer than other screens */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/20 via-transparent to-[#5B16D6]/10" />
      
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5" />
      
      {/* 狀態列已移除 - 用戶會有自己的狀態列 */}
      
      {/* Title section */}
      <div className="absolute top-[80px] left-8 right-8">
        <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[36px] leading-[1.1] tracking-[-0.02em] text-center">
          {language === 'zh' ? '友善提醒' : 'A friendly reminder'}
        </h1>
      </div>
      
      {/* Content container with flex layout */}
      <div className="absolute top-[160px] left-8 right-8 flex flex-col gap-5">
        {/* Body content card - soft glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          {language === 'zh' ? (
            <>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center">
                感谢身为 Mike App 第一批早期支持者的你！
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center mt-3">
                {premium_user_type === 1 ? (
                  <>你的 VIP 权限将持续至 <span className="font-semibold">2/4</span>。</>
                ) : (
                  <>你的 VIP 权限将持续至 <span className="font-semibold">2/19</span>。</>
                )}
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center mt-3">
                {premium_user_type === 1 ? (
                  <>若你希望继续使用 VIP 功能，并保留您原先的 <span className="font-semibold">US$469</span>早鸟价，请在 <span className="font-semibold">2/4</span>到期前完成续订即可。</>
                ) : (
                  <>若你希望继续使用 VIP 功能，并保留您原先的 <span className="font-semibold">US$509</span>早鸟价，请在 <span className="font-semibold">2/19</span>到期前完成续订即可。</>
                )}
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center mt-3">
                之后 Mike App 年订阅价格都会更新至 US$559以上，不再提供早鸟价优惠。
              </p>
            </>
          ) : (
            <>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center">
                Thank you for growing with Mike App from the very beginning.
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center mt-3">
                {premium_user_type === 1 ? (
                  <>Your VIP access remains active until <span className="font-semibold">Feb 4</span>.</>
                ) : (
                  <>Your VIP access remains active until <span className="font-semibold">Feb 19</span>.</>
                )}
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center mt-3">
                {premium_user_type === 1 ? (
                  <>If you choose to renew before then, you can keep your <span className="font-semibold">US$469</span> early-bird price.</>
                ) : (
                  <>If you choose to renew before then, you can keep your <span className="font-semibold">US$509</span> early-bird price.</>
                )}
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center mt-3">
                Future annual plans will be updated to US$559 or higher.
              </p>
            </>
          )}
        </div>
        
        {/* Most Used VIP Features - Conditional Display */}
        {vipFeatures.length > 0 && (
          <div className="bg-white/8 backdrop-blur-lg rounded-2xl p-5 border border-white/15">
            <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[13px] leading-[1.3] text-center mb-3">
              {language === 'zh' ? '你最常使用的 VIP 功能' : 'Your most-used VIP features'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {vipFeatures.map((feature, index) => (
                <div key={index} className="bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
                  <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white text-[12px] leading-[1.2]">
                    {language === 'zh' ? feature.chinese : feature.english}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* CTA buttons section */}
      <div className="absolute bottom-[140px] left-8 right-8">
        {/* Primary CTA - calm and confident */}
        <button 
          onClick={() => {
            // 根據 premium_user_type 決定連結
            // premium_user_type = 1 → https://cmy.tw/00Cl6t
            // premium_user_type = 2 → https://cmy.tw/00CnkI
            const renewUrl = premium_user_type === 1 
              ? 'https://cmy.tw/00Cl6t' 
              : 'https://cmy.tw/00CnkI';
            window.open(renewUrl, '_blank');
          }}
          className="w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-lg shadow-black/10 hover:bg-white/95 transition-all mb-3">
          {language === 'zh' ? '续订我的方案' : 'Renew my plan'}
        </button>
        
        {/* Secondary action - low emphasis */}
        <button className="w-full text-white/70 font-['Inter','Noto_Sans_SC'] font-medium text-[14px] hover:text-white/90 transition-colors py-2">
          {language === 'zh' ? '暂时不要' : 'Not now'}
        </button>
      </div>
      
      {/* Reassurance line - very subtle */}
      <div className="absolute bottom-[80px] left-8 right-8">
        <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/40 text-[12px] leading-[1.5] text-center">
          {language === 'zh' 
            ? '没有压力 —— 我们只是不想让你意外失去访问权限。' 
            : "No pressure — we just don't want you to lose access by surprise."}
        </p>
      </div>
    </div>
  );
}

export default function MikeWrap() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 處理帳號辨識成功
  const handleAccountRecognized = (account: string) => {
    // 帳號已自動填入，不需要額外處理
    console.log('帳號辨識成功:', account);
  };
  
  // 處理「查看我的年度回顧」按鈕點擊
  const handleSeeWrap = async () => {
    // 從 Screen1 取得當前輸入的帳號
    // 注意：這裡需要從 Screen1 的 state 取得，但由於組件結構，我們需要通過其他方式
    // 暫時使用一個共享的 ref 或 state
    // 為了簡化，我們在 Screen1 中直接處理這個邏輯
  };
  
  // 從 Screen1 呼叫的函數，用於載入用戶資料
  const loadUserData = async (account: string) => {
    if (!account.trim()) {
      setErrorMessage(
        language === 'zh'
          ? '請輸入帳號或上傳截圖'
          : 'Please enter your account or upload a screenshot'
      );
      return false;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 呼叫 API 取得用戶資料
      const data = await getUserData(account.trim());
      
      if (data) {
        // 更新用戶資料
        setUserData(data);
        // 導航到下一個畫面
        setCurrentScreen(1);
        return true;
      } else {
        setErrorMessage(
          language === 'zh'
            ? '找不到此帳號的資料，請確認帳號是否正確'
            : 'Account not found, please verify your account'
        );
        return false;
      }
    } catch (error: any) {
      console.error('載入用戶資料錯誤:', error);
      const errorMsg = error.message || (
        language === 'zh'
          ? '系統忙碌中，請稍後再試'
          : 'System is busy, please try again later'
      );
      setErrorMessage(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 輔助函數：檢查是否可以切換到指定頁面
  // 只有首頁（index 0）或已登入（userData 存在）時才能切換
  const canNavigateToScreen = (screenIndex: number) => {
    // 首頁（index 0）永遠可以訪問
    if (screenIndex === 0) return true;
    // 其他頁面需要 userData 存在才能訪問
    return userData !== null;
  };
  
  // 安全地切換頁面
  const handleScreenChange = (newScreen: number) => {
    if (canNavigateToScreen(newScreen)) {
      setCurrentScreen(newScreen);
    }
  };
  
  // 依據 premium_user_type 動態決定是否顯示最後一頁（續訂提醒）
  const premiumUserType = userData?.premium_user_type ?? 3;

  const screens = [
    <Screen1 
      key="screen1" 
      onAccountRecognized={handleAccountRecognized}
      onSeeWrap={() => {
        // 這個函數會在 Screen1 內部處理，因為需要取得 accountInput
        // 我們通過一個 ref 或 callback 來取得
      }}
      onLoadUserData={loadUserData}
    />,
    <Screen2 key="screen2" userData={userData} />,
    <Screen3 key="screen3" userData={userData} />,
    <Screen4 key="screen4" userData={userData} />,
    <Screen5 key="screen5" userData={userData} />,
    <Screen5a key="screen5a" userData={userData} />,
    <Screen8 key="screen8" userData={userData} />,
    // 只有 premium_user_type 為 1 或 2 時，才顯示續訂提醒頁
    ...(premiumUserType === 1 || premiumUserType === 2
      ? [<Screen9 key="screen9" userData={userData} />]
      : []),
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="bg-[#f5f5f5] relative size-full overflow-x-auto" data-name="mike-wrap">
      {/* Desktop view - all screens in a row */}
      <div className="hidden lg:flex gap-8 p-8 min-w-max">
        {screens.map((screen, index) => (
          <div key={index} className="flex-shrink-0 shadow-2xl rounded-3xl overflow-hidden">
            {screen}
          </div>
        ))}
      </div>
      
      {/* Mobile view - swipeable carousel */}
      <div className="lg:hidden relative h-full flex items-center justify-center">
        <div className="relative w-full max-w-[390px] h-[844px]">
          {screens[currentScreen]}
          
          {/* Navigation dots */}
          <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 flex gap-2">
            {screens.map((_, index) => (
              <button
                key={index}
                onClick={() => handleScreenChange(index)}
                disabled={!canNavigateToScreen(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentScreen === index 
                    ? 'bg-purple-600 w-6' 
                    : canNavigateToScreen(index)
                    ? 'bg-gray-300 hover:bg-gray-400 cursor-pointer'
                    : 'bg-gray-200 opacity-50 cursor-not-allowed'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation arrows */}
          {currentScreen > 0 && (
            <button
              onClick={() => handleScreenChange(currentScreen - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* 右箭頭：只有在已登入且不是最後一頁時才顯示 */}
          {currentScreen < screens.length - 1 && userData !== null && (
            <button
              onClick={() => handleScreenChange(currentScreen + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
    </LanguageContext.Provider>
  );
}
