import svgPaths from "../../imports/svg-3vt1zivl9b";
import { useState, createContext, useContext, useRef } from "react";
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

// --- Responsive Layout Wrapper ---
// Replaces fixed 844px height with 100svh for mobile browsers
function ScreenWrapper({ 
  children, 
  background, 
  className = "",
  dataName
}: { 
  children: React.ReactNode; 
  background?: string; 
  className?: string;
  dataName?: string;
}) {
  return (
    <div className={`relative w-full h-full lg:h-[844px] lg:w-[390px] overflow-hidden flex flex-col ${className}`} data-name={dataName}>
      {/* Background Layer */}
      {background && (
        <img 
          alt="" 
          className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full" 
          src={background} 
        />
      )}
      {children}
    </div>
  );
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

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        language === 'zh' 
          ? '圖片大小超過 5MB，請上傳較小的圖片'
          : 'Image size exceeds 5MB, please upload a smaller image'
      );
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrorMessage(
        language === 'zh'
          ? '不支援的圖片格式，請上傳 JPEG、PNG 或 WebP 格式'
          : 'Unsupported image format, please upload JPEG, PNG, or WebP'
      );
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
        if (onAccountRecognized) {
          onAccountRecognized(result.account_prefix);
        }
      } else {
        const message = language === 'zh' 
          ? (result.user_message_zh || '辨識失敗，請稍後再試')
          : (result.user_message_en || result.user_message_zh || 'Recognition failed, please try again');
        setErrorMessage(message);
      }
    } catch (error) {
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
    <ScreenWrapper background={imgLoginBackground} className="bg-[#5B16D6]" dataName="Login">
      
      {/* Language Toggle - Absolute Top Right (Safe Area) */}
      <div className="absolute top-[max(20px,env(safe-area-inset-top))] right-6 z-20 pt-4">
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
      
      {/* Main Content - Flex Column for Vertical Centering */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 w-full h-full pb-safe">
        <div className="w-full max-w-[320px] space-y-8">
          <div className="space-y-4 text-center sm:text-left">
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
                    className="flex-1 bg-transparent font-['Inter','Noto_Sans_SC'] font-medium text-white text-[15px] outline-none placeholder:text-white/40 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
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
                    <img src={uploadedImage} alt="Uploaded screenshot" className="w-full rounded-lg max-h-[100px] object-cover" />
                  </div>
                )}
              </div>
            </div>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/60 text-[13px] leading-[1.5]">
              {language === 'zh' 
                ? <>请输入你登录 Mike App 使用的账号（@ 前的部分），或上传<a href="mikeapp://more" className="underline cursor-pointer hover:text-white/80 transition-colors">「更多页」</a>的截图。</>
                : <>Enter the account you use to log in to Mike App (the part before @), or upload a screenshot of the <a href="mikeapp://more" className="underline cursor-pointer hover:text-white/80 transition-colors">"More"</a> page.</>}
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
            <button className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-6 py-3 font-['Inter','Noto_Sans_SC'] font-semibold text-[15px] hover:bg-white/15 transition-all">
              {language === 'zh' ? '返回麦克APP' : 'Back to Mike App'}
            </button>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function Screen2({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const wrapData = mapUserDataToWrapData(userData);
  const { days_with_mike } = wrapData;

  return (
    <ScreenWrapper background={imgLoginBackground} className="bg-[#5B16D6]" dataName="Welcome">
      {/* Texture Layers */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-35" src={imgEvolutionBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/25 via-transparent to-[#5B16D6]/15 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
      
      {/* Content - Flex Column for even spacing */}
      <div className="relative z-10 flex flex-col justify-between h-full w-full p-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        
        {/* Spacer for top */}
        <div className="flex-1" />

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center flex-[2]">
          <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[18px] leading-[1.3] text-center mb-4">
            {language === 'zh' ? '与麦克同行的日子' : 'DAYS WITH MIKE'}
          </p>
          <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[160px] sm:text-[180px] leading-[0.85] tracking-[-0.04em] text-center">
            {days_with_mike}
          </h1>
        </div>
        
        {/* Bottom Content */}
        <div className="flex-1 flex flex-col justify-end items-center">
          <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/60 text-[15px] leading-[1.5] text-center max-w-[320px]">
            {language === 'zh'
              ? '感谢你在 2025 与 Mike 并肩，很高兴能见证你的每一次跃升'
              : 'Thank you for walking alongside Mike in 2025.\nWe\'re grateful to witness every step of your growth.'}
          </p>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function Screen3({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const wrapData = mapUserDataToWrapData(userData);
  const { active_days, days_with_mike, login_percentage, active_days_level_grade } = wrapData;

  return (
    <ScreenWrapper background={imgUserTypeBackground} className="bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" dataName="Days Logged">
      {/* Texture Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/30 via-transparent to-[#5B16D6]/20 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      
      {/* Flex Container */}
      <div className="relative z-10 flex flex-col h-full w-full px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        
        {/* Header */}
        <div className="mt-8">
          <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[16px] leading-[1.3] tracking-[0.05em] uppercase mb-3">
            {language === 'zh' ? '活跃天数' : 'Active Days'}
          </p>
          <div className="h-[1px] w-16 bg-white/40" />
        </div>
        
        {/* Big Stat - Centered vertically in available space */}
        <div className="flex-1 flex flex-col justify-center items-center py-4">
          <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[160px] sm:text-[180px] leading-[0.85] tracking-[-0.04em] text-center">
            {active_days}
          </h1>
        </div>
        
        {/* Secondary Stats */}
        <div className="mb-8">
          <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/70 text-[15px] leading-[1.5]">
            {language === 'zh' 
              ? `在 ${days_with_mike} 天里，你登录了` 
              : `Out of ${days_with_mike} days, you logged in`}
          </p>
          <p className="font-['Inter','Noto_Sans_SC'] font-bold text-white text-[28px] leading-[1.2] mt-2">
            {login_percentage}% {language === 'zh' ? '的时间' : 'of the time'}
          </p>
        </div>
        
        {/* Insight Card - Pinned to bottom */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-4">
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
    </ScreenWrapper>
  );
}

function Screen4({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const user_type = userData?.usertype || 2; // 1 or 2
  
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
  const hasVIPFeatures = [feature_1_vip, feature_2_vip, feature_3_vip, feature_4_vip, feature_5_vip].includes(1);

  const splitFeatureName = (name: string) => {
    const chineseMatch = name.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
    const englishMatch = name.match(/[a-zA-Z\s']+/g);
    
    return {
      chinese: chineseMatch ? chineseMatch.join('') : '',
      english: englishMatch ? englishMatch.join('').trim() : ''
    };
  };

  return (
    <ScreenWrapper background={imgMikeTradeBackground} className="bg-[#5B16D6]" dataName="Top Functions">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/50 via-[#5B16D6]/40 to-[#4A0FB8]/50 mix-blend-color" />
      <div className="absolute inset-0 bg-[#5B16D6]/30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent" />
      
      {/* Flex Container */}
      <div className="relative z-10 flex flex-col h-full w-full px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        
        {/* Header */}
        <div className="mt-4 mb-6">
          <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/60 text-[14px] leading-[1.3] tracking-[0.1em] uppercase mb-2">
            {language === 'zh' ? `你的前 ${user_type === 1 ? '3' : '5'} 名` : `Your Top ${user_type === 1 ? '3' : '5'}`}
          </p>
          <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] leading-[1] tracking-[-0.02em]">
            {language === 'zh' ? '最常使用的\n功能' : 'Most Used\nFeatures'}
          </h2>
        </div>
        
        {/* Features List - Flexible expansion */}
        <div className={`flex-1 flex flex-col ${user_type === 1 ? 'justify-center gap-5' : 'justify-start gap-3'}`}>
          {features.map((feature, index) => {
            const { chinese, english } = splitFeatureName(feature.name);
            
            // Dynamic classes based on list size
            const barHeight = user_type === 1 
              ? (index === 0 ? 'h-[140px]' : index === 1 ? 'h-[100px]' : 'h-[80px]') 
              : 'h-[64px]';
              
            const rankSize = user_type === 1 
              ? (index === 0 ? 'text-[70px]' : index === 1 ? 'text-[56px]' : 'text-[42px]')
              : 'text-[42px]';
            
            const borderRadius = user_type === 1 ? 'rounded-2xl' : 'rounded-full';
            const displayRank = user_type === 1 ? String(index + 1) : feature.rank;
            
            return (
              <div key={index} className="flex items-center gap-4">
                {/* Rank Number */}
                <div className={`flex-shrink-0 ${user_type === 1 ? 'w-16 justify-start' : 'w-14 justify-center'} flex items-center`}>
                  <span className={`font-['Space_Grotesk','Noto_Sans_SC'] font-normal text-white/80 ${rankSize} leading-[1]`}>
                    {displayRank}
                  </span>
                </div>
                
                {/* Bar */}
                <div className="flex-1">
                  <div className={`${barHeight} bg-white/15 backdrop-blur-xl ${borderRadius} flex items-center justify-between px-6 shadow-lg shadow-black/10 border border-white/40 relative overflow-hidden`}>
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <div className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent ${borderRadius}`} />
                    
                    <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center relative z-10">
                      <p className={`font-['Inter','Noto_Sans_SC'] font-semibold text-white leading-[1.2] tracking-[0.01em] ${user_type === 1 && index === 0 ? 'text-[24px]' : 'text-[17px]'} drop-shadow-sm`}>
                        {chinese}
                      </p>
                      <p className={`font-['Inter','Noto_Sans_SC'] font-normal text-white/80 leading-[1.2] tracking-[0.02em] mt-0.5 text-[12px] drop-shadow-sm`}>
                        {english}
                      </p>
                    </div>
                    
                    {feature.isVIP && (
                      <div className="flex-shrink-0 relative z-10">
                        <Crown className="text-white drop-shadow-md" size={20} strokeWidth={2.5} fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* VIP Summary - Pinned Bottom */}
        {hasVIPFeatures && (
          <div className="mt-6 mb-4">
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
    </ScreenWrapper>
  );
}

function Screen5({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  return (
    <ScreenWrapper background={imgLoginBackground} className="bg-[#5B16D6]" dataName="Product Evolution">
      {/* Texture Layers */}
      <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full opacity-35" src={imgEvolutionBackground} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/25 via-transparent to-[#5B16D6]/15 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10" />
      
      {/* Flex Container */}
      <div className="relative z-10 flex flex-col h-full w-full px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        
        {/* Title */}
        <div className="mt-4 mb-6">
          <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[32px] sm:text-[36px] leading-[1] tracking-[-0.02em]">
            {language === 'zh' ? '陪你变强的路上，Mike App 也不断在进化' : 'As you grow stronger, Mike App grows with you'}
          </h2>
        </div>
        
        {/* Timeline - Flexible Space */}
        <div className="flex-1 relative flex flex-col justify-center gap-4 pl-4">
          {/* Vertical Line */}
          <div className="absolute left-[22px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-white/30 via-white/20 to-white/10" />
          
          {/* Milestones */}
          {[
            { month: 'MAR', img: imgChatRoom, title: language === 'zh' ? '文字聊天室' : 'Chat Room', desc: language === 'zh' ? '连接、讨论、与他人一起成长' : 'Connect, discuss, and grow with others.' },
            { month: 'AUG', img: imgMikeTrade, title: language === 'zh' ? '投资日志' : 'Investment Journal', desc: language === 'zh' ? '记录决策、回顾逻辑' : 'Record decisions, review logic.' },
            { month: 'NOV', img: imgLiveRoom, title: language === 'zh' ? '首页&语音聊天室' : 'Home Page & Live Room', desc: language === 'zh' ? '全新实时学习方式' : 'Real-time learning.' }
          ].map((item, i) => (
            <div key={i} className="relative pl-12">
              <div className="absolute left-0 top-0">
                <div className={`w-12 h-12 rounded-full ${i === 2 ? 'bg-white/30 border-white/60 shadow-lg shadow-white/20' : 'bg-white/15 border-white/30'} backdrop-blur-lg border-2 flex items-center justify-center`}>
                  <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[13px]">{item.month}</p>
                </div>
              </div>
              
              <div className={`bg-white/12 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/25 shadow-xl shadow-black/10 relative ${i === 2 ? 'h-[140px] sm:h-[160px]' : 'h-[100px] sm:h-[115px]'}`}>
                <img alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" src={item.img} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className={`font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white ${i === 2 ? 'text-[24px]' : 'text-[20px]'} leading-[1.1] mb-1`}>{item.title}</h3>
                  <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[12px] leading-[1.3] line-clamp-2">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-6 mb-4 text-center">
          <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-medium text-white/80 text-[16px] leading-[1.3] tracking-[-0.01em]">
            {language === 'zh' ? (
              <>一步一步，麦克与你一起成长。<br />—— 2026 年，我们将继续创造更多。</>
            ) : (
              <>Step by step, Mike grew with you.<br />— and in 2026, we'll keep building even more.</>
            )}
          </p>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function Screen5a({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  return (
    <ScreenWrapper background={imgMikeTradeBackground} className="bg-[#5B16D6]" dataName="Portfolio Performance">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/50 via-[#5B16D6]/40 to-[#4A0FB8]/50 mix-blend-color" />
      <div className="absolute inset-0 bg-[#5B16D6]/30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
      
      <div className="relative z-10 flex flex-col h-full w-full px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        {/* Header */}
        <div className="mt-4 mb-8">
          <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/60 text-[14px] leading-[1.3] tracking-[0.1em] uppercase mb-2">
            {language === 'zh' ? '2025策略年度表现' : '2025 strategy performance'}
          </p>
          <h2 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] leading-[1.1] tracking-[-0.02em]">
            {language === 'zh' ? '麦克精选' : "Mike's Pick"}
          </h2>
        </div>
        
        {/* Stats Container - Centered */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {/* Main Stat */}
          <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/25 shadow-xl shadow-black/10">
            <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[13px] uppercase tracking-wide mb-2">
              {language === 'zh' ? '总收益' : 'Total Return'}
            </p>
            <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[80px] sm:text-[96px] leading-[0.9] tracking-[-0.04em]">
              +42%
            </h1>
          </div>
          
          {/* Comparison */}
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
          
          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] sm:text-[48px] leading-[0.9] tracking-[-0.03em] mb-2">
                11
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/80 text-[13px] leading-[1.4]">
                {language === 'zh' ? '檔股票翻超過一倍' : 'stocks doubled'}
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[11px] mt-1">
                +100% {language === 'zh' ? '或更多' : 'or more'}
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
              <p className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[42px] sm:text-[48px] leading-[0.9] tracking-[-0.03em] mb-2">
                6
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/80 text-[13px] leading-[1.4]">
                {language === 'zh' ? '檔股票翻超過兩倍' : 'stocks tripled'}
              </p>
              <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/50 text-[11px] mt-1">
                +200% {language === 'zh' ? '或更多' : 'or more'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function Screen8({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const screenRef = useRef<HTMLDivElement>(null);
  const mike_type = userData?.mike_type || 3;
  
  const getMikeTypeContent = () => {
    switch(mike_type) {
      case 1:
        return {
          title: language === 'zh' ? "社群\n连接者" : "Community\nConnector",
          description: language === 'zh' ? "你擅长借力集体的智慧，在共鸣中寻找答案" : "You grow faster when you learn with others.",
          subtitle: language === 'zh' ? "你擅长借力集体的智慧，在共鸣中寻找答案，将众人的灵感内化为自己的决策。这种对信息流的敏锐捕捉，让你在市场中不再是孤军奋战。" : "Perspective is your real advantage."
        };
      case 2:
        return {
          title: language === 'zh' ? "信号\n狙击手" : "Signal\nHunter",
          description: language === 'zh' ? "你不为噪音所动，只在信号明确的瞬间果断出手" : "You move when timing matters.",
          subtitle: language === 'zh' ? "你不为噪音所动，只在信号明确的瞬间果断出手。这种不轻易出鞘的克制，让你总能踩准市场的节拍。" : "Signals guide your decisions."
        };
      case 3:
        return {
          title: language === 'zh' ? "情报\n分析师" : "Insight\nCollector",
          description: language === 'zh' ? "你在事件背后的底层逻辑中寻找答案" : "You look for the 'why' behind every move.",
          subtitle: language === 'zh' ? "你在事件背后的底层逻辑中寻找答案。这种稳扎稳打的风格，让你在面对波动时比别人多了一份从容。" : "Understanding comes before action."
        };
      case 4:
        return {
          title: language === 'zh' ? "系统\n架构师" : "System\nCrafter",
          description: language === 'zh' ? "你深知，一套成熟的体系远比运气更重要" : "You turn ideas into repeatable decisions.",
          subtitle: language === 'zh' ? "你深知，一套成熟的体系远比运气更重要。你习惯将复杂的操作磨炼成可重复的纪律，就算市场震荡，你的动作依然有章法。" : "Process keeps you sharp."
        };
      default: return { title: "", description: "", subtitle: "" };
    }
  };
  
  const content = getMikeTypeContent();
  
  const handleSaveImage = async () => {
    if (screenRef.current) {
      try {
        const dataUrl = await toPng(screenRef.current, { backgroundColor: '#5B16D6', pixelRatio: 2, cacheBust: true, filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-exclude-from-capture')) });
        const link = document.createElement('a');
        link.download = `mike-wrap-${language}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) { console.error('Error saving image:', error); }
    }
  };

  return (
    <div ref={screenRef} className="w-full h-full">
      <ScreenWrapper background={imgUserTypeBackground} className="bg-gradient-to-b from-[#7B3FE4] via-[#5B16D6] to-[#4A0FB8]" dataName="User Type">
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B16D6]/30 via-transparent to-[#5B16D6]/20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
        
        {/* Flex Content */}
        <div className="relative z-10 flex flex-col h-full w-full px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))] items-center">
          
          <div className="text-center mt-4">
            <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white/50 text-[12px] leading-[1.3] tracking-[0.2em] uppercase">
              {language === 'zh' ? '你的麦克类型' : 'Your Mike Type'}
            </p>
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/90 text-[16px] leading-[1.5] mt-2">
              {language === 'zh' ? '分析你的活动后，你是一位…' : "After analyzing your activity, you're a…"}
            </p>
          </div>
          
          {/* Main Visual - Centered */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
             {/* Icon Placeholder */}
            <div className="relative w-[200px] h-[200px] mb-4 opacity-50">
              <svg className="w-full h-full" viewBox="0 0 280 280" fill="none">
                 <circle cx="140" cy="140" r="100" stroke="white" strokeWidth="2" strokeDasharray="10 10" opacity="0.3"/>
                 <circle cx="140" cy="140" r="60" fill="white" fillOpacity="0.1"/>
              </svg>
            </div>
            
            <h1 className={`font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[48px] sm:text-[56px] ${language === 'zh' ? 'leading-[1.4]' : 'leading-[0.95]'} tracking-[-0.03em] text-center whitespace-pre-line`}>
              {content.title}
            </h1>
            
            {language !== 'zh' && (
              <p className="font-['Inter','Noto_Sans_SC'] font-semibold text-white text-[20px] leading-[1.3] text-center tracking-[-0.01em] mt-4 px-4">
                {content.description}
              </p>
            )}
            
            <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/85 text-[15px] leading-[1.6] text-center whitespace-pre-line max-w-[320px] mt-6">
              {content.subtitle}
            </p>
          </div>
          
          {/* Buttons */}
          <div className="w-full space-y-3 mb-4" data-exclude-from-capture="true">
            <button 
              onClick={handleSaveImage}
              className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-xl hover:bg-white/20 transition-all">
              {language === 'zh' ? '保存图片' : 'Save Image'}
            </button>
            <button className="w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-xl hover:bg-white/95 transition-all">
              {language === 'zh' ? '分享' : 'Share'}
            </button>
          </div>
        </div>
      </ScreenWrapper>
    </div>
  );
}

function Screen9({ userData }: { userData: UserData | null }) {
  const { language } = useLanguage();
  const premium_user_type = userData?.premium_user_type || 1;
  
  if (premium_user_type === 3) return null;
  
  const feature_1 = "語音聊天室 live room";
  const feature_2 = "麥克精選 mike's pick";
  const feature_3 = "俱樂部 club";
  const feature_4 = "麥克交易 mike's trade";
  const feature_5 = "影片 video";
  
  const feature_1_vip = 1;
  const feature_2_vip = 1;
  const feature_3_vip = 2;
  const feature_4_vip = 1;
  const feature_5_vip = 2;
  
  const splitFeatureName = (name: string) => {
    const chineseMatch = name.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g);
    const englishMatch = name.match(/[a-zA-Z\s']+/g);
    return {
      chinese: chineseMatch ? chineseMatch.join('') : '',
      english: englishMatch ? englishMatch.join('').trim() : ''
    };
  };
  
  const allFeatures = [
    { name: feature_1, isVIP: feature_1_vip === 1 },
    { name: feature_2, isVIP: feature_2_vip === 1 },
    { name: feature_3, isVIP: feature_3_vip === 1 },
    { name: feature_4, isVIP: feature_4_vip === 1 },
    { name: feature_5, isVIP: feature_5_vip === 1 },
  ];
  
  const vipFeatures = allFeatures.filter(f => f.isVIP).slice(0, 3).map(f => splitFeatureName(f.name));
  
  return (
    <ScreenWrapper background={imgLoginBackground} className="bg-[#5B16D6]" dataName="Premium Reminder">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B3FE4]/20 via-transparent to-[#5B16D6]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5" />
      
      <div className="relative z-10 flex flex-col h-full w-full px-8 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(60px,env(safe-area-inset-top))]">
        <div className="mt-4 mb-6">
          <h1 className="font-['Space_Grotesk','Noto_Sans_SC'] font-bold text-white text-[36px] leading-[1.1] tracking-[-0.02em] text-center">
            {language === 'zh' ? '友善提醒' : 'A friendly reminder'}
          </h1>
        </div>
        
        {/* Content Card - Flexible */}
        <div className="flex-1 flex flex-col justify-center gap-5">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            {language === 'zh' ? (
              <>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center">
                  感谢身为 Mike App 第一批早期支持者的你！
                </p>
                <div className="my-4 p-3 bg-white/10 rounded-xl">
                  <p className="text-white/70 text-[12px] text-center uppercase mb-1">VIP 有效期至</p>
                  <p className="text-center font-bold text-white text-[20px]">
                    {premium_user_type === 1 ? "2026/01/17" : "2026/02/01"}
                  </p>
                </div>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[14px] leading-[1.5] text-center">
                  若希望保留 <span className="font-semibold">{premium_user_type === 1 ? "US$469" : "US$509"}</span> 早鸟价，请在到期前完成续订。
                </p>
              </>
            ) : (
              <>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[15px] leading-[1.5] text-center">
                  Thank you for growing with Mike App from the very beginning.
                </p>
                <div className="my-4 p-3 bg-white/10 rounded-xl">
                  <p className="text-white/70 text-[12px] text-center uppercase mb-1">VIP Access Until</p>
                  <p className="text-center font-bold text-white text-[20px]">
                    {premium_user_type === 1 ? "Jan 17, 2026" : "Feb 01, 2026"}
                  </p>
                </div>
                <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white text-[14px] leading-[1.5] text-center">
                  Renew before expiry to keep your <span className="font-semibold">{premium_user_type === 1 ? "US$469" : "US$509"}</span> early-bird price.
                </p>
              </>
            )}
          </div>
          
          {vipFeatures.length > 0 && (
            <div className="bg-white/8 backdrop-blur-lg rounded-2xl p-4 border border-white/15">
              <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white/70 text-[12px] text-center mb-3">
                {language === 'zh' ? '你最常使用的 VIP 功能' : "Your most-used VIP features"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {vipFeatures.map((feature, index) => (
                  <div key={index} className="bg-white/10 rounded-full px-3 py-1 border border-white/20">
                    <p className="font-['Inter','Noto_Sans_SC'] font-medium text-white text-[12px]">
                      {language === 'zh' ? feature.chinese : feature.english}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="mt-6 mb-4">
          <button className="w-full bg-white text-[#5B16D6] rounded-2xl px-6 py-4 font-['Inter','Noto_Sans_SC'] font-bold text-[16px] shadow-lg hover:bg-white/95 transition-all mb-3">
            {language === 'zh' ? '续订我的方案' : 'Renew my plan'}
          </button>
          
          <button className="w-full text-white/70 font-['Inter','Noto_Sans_SC'] font-medium text-[14px] hover:text-white/90 transition-colors py-2">
            {language === 'zh' ? '暂时不要' : 'Not now'}
          </button>
        </div>
        
        <div className="mb-2">
          <p className="font-['Inter','Noto_Sans_SC'] font-normal text-white/40 text-[12px] leading-[1.3] text-center">
            {language === 'zh' 
              ? '没有压力 —— 我们只是不想让你意外失去访问权限。' 
              : "No pressure — we just don't want you to lose access by surprise."}
          </p>
        </div>
      </div>
    </ScreenWrapper>
  );
}

export default function MikeWrap() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const handleAccountRecognized = (account: string) => {
    console.log('帳號辨識成功:', account);
  };
  
  const loadUserData = async (account: string) => {
    try {
      const data = await getUserData(account.trim());
      if (data) {
        setUserData(data);
        setCurrentScreen(1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('載入用戶資料錯誤:', error);
      return false;
    }
  };
  
  const screens = [
    <Screen1 key="screen1" onAccountRecognized={handleAccountRecognized} onLoadUserData={loadUserData} />,
    <Screen2 key="screen2" userData={userData} />,
    <Screen3 key="screen3" userData={userData} />,
    <Screen4 key="screen4" userData={userData} />,
    <Screen5 key="screen5" userData={userData} />,
    <Screen5a key="screen5a" userData={userData} />,
    <Screen8 key="screen8" userData={userData} />,
    <Screen9 key="screen9" userData={userData} />,
  ].filter(Boolean); // Filter out null screens (like Screen9 if not VIP)

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div className="bg-[#1a1a1a] relative w-full h-full lg:h-screen lg:w-screen lg:overflow-hidden" data-name="mike-wrap">
        
        {/* Desktop view - all screens in a horizontal scroll */}
        <div className="hidden lg:flex gap-10 p-10 h-full overflow-x-auto items-center">
          {screens.map((screen, index) => (
            <div key={index} className="flex-shrink-0 shadow-2xl rounded-[40px] overflow-hidden border-[8px] border-black/80 h-[844px] w-[390px] ring-1 ring-white/10">
              {screen}
            </div>
          ))}
        </div>
      
        {/* Mobile view - Full Screen + Tap Navigation */}
        <div className="lg:hidden fixed inset-0 w-full h-[100svh]">
          {/* Active Screen */}
          <div className="w-full h-full">
            {screens[currentScreen]}
          </div>
          
          {/* Progress Indicators - Top for Stories style or Bottom dots */}
          <div className="absolute top-[max(10px,env(safe-area-inset-top))] left-4 right-4 flex gap-1 z-50">
            {screens.map((_, index) => (
              <div 
                key={index}
                className={`h-1 rounded-full transition-all duration-300 flex-1 ${
                  index <= currentScreen ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          
          {/* Invisible Touch Zones for Navigation */}
          <div className="absolute inset-0 flex z-40">
            {/* Left Zone (Previous) */}
            <div 
              className="w-1/3 h-full" 
              onClick={(e) => {
                e.stopPropagation();
                if (currentScreen > 0) setCurrentScreen(c => c - 1);
              }} 
            />
            {/* Right Zone (Next) */}
            <div 
              className="w-2/3 h-full" 
              onClick={(e) => {
                e.stopPropagation();
                if (currentScreen < screens.length - 1) setCurrentScreen(c => c + 1);
              }} 
            />
          </div>
        </div>
      </div>
    </LanguageContext.Provider>
  );
}
