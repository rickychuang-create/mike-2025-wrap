import svgPaths from "./svg-3vt1zivl9b";
type StatusBarTextProps = {
  text: string;
};

function StatusBarText({ text }: StatusBarTextProps) {
  return (
    <div className="absolute bg-white h-[47px] left-0 overflow-clip top-0 w-[390px]">
      <div className="absolute h-[13px] right-[18px] top-[18px] w-[25px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 13">
          <g id="Battery">
            <path d={svgPaths.p389e5ad0} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, #1E1E1E)" />
            <path d={svgPaths.p1f70d00} fill="var(--fill-0, #1E1E1E)" id="Combined Shape" opacity="0.4" />
            <path d={svgPaths.p3fe32bf0} fill="var(--fill-0, #1E1E1E)" id="Rectangle_2" />
          </g>
        </svg>
      </div>
      <div className="absolute h-[12px] right-[49px] top-[18px] w-[16px]" data-name="Wifi">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 12">
          <path clipRule="evenodd" d={svgPaths.p271e8000} fill="var(--fill-0, #1E1E1E)" fillRule="evenodd" id="Wifi" />
        </svg>
      </div>
      <div className="absolute h-[10px] right-[71px] top-[20px] w-[17px]" data-name="Cellular">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 10">
          <path clipRule="evenodd" d={svgPaths.pf9b5040} fill="var(--fill-0, #1E1E1E)" fillRule="evenodd" id="Cellular" />
        </svg>
      </div>
      <p className="absolute font-['SF_Pro_Text:Semibold',sans-serif] leading-[normal] left-[34px] not-italic text-[#1e1e1e] text-[15px] text-nowrap top-[16px]">{text}</p>
    </div>
  );
}

export default function Wireframe() {
  return (
    <div className="bg-[#f5f5f5] relative size-full" data-name="wireframe">
      <div className="absolute bg-white h-[844px] left-[174px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 1">
        <StatusBarText text="9:41" />
        <div className="absolute content-stretch flex flex-col gap-[8px] items-start left-[calc(50%+0.5px)] top-1/2 translate-x-[-50%] translate-y-[-50%] w-[269px]" data-name="Input Field">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.4] min-w-full not-italic relative shrink-0 text-[#1e1e1e] text-[16px] w-[min-content]">Account you log in mike app</p>
          <div className="bg-white min-w-[120px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
            <div className="flex flex-row items-center min-w-[inherit] overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center min-w-[inherit] px-[16px] py-[12px] relative w-full">
                <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-none min-h-px min-w-px not-italic relative shrink-0 text-[#b3b3b3] text-[16px]">example123@gmail.com</p>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
          </div>
        </div>
        <div className="absolute bg-[#2c2c2c] left-[61px] rounded-[8px] top-[471px] w-[269px]" data-name="Button">
          <div className="content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[inherit] w-full">
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-none not-italic relative shrink-0 text-[#f5f5f5] text-[16px] text-nowrap">See my wraps</p>
          </div>
          <div aria-hidden="true" className="absolute border border-[#2c2c2c] border-solid inset-0 pointer-events-none rounded-[8px]" />
        </div>
      </div>
      <div className="absolute bg-white h-[844px] left-[605px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 2">
        <div className="absolute bg-[#d9d9d9] h-[111px] left-0 top-[158px] w-[319px]" />
        <StatusBarText text="9:41" />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-99px)] not-italic text-[16px] text-black text-nowrap top-[326px]">You’ve joined Mike app for</p>
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-21px)] not-italic text-[16px] text-black text-nowrap top-[406px]">DAYS</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[149px] not-italic text-[48px] text-black text-nowrap top-[348px] tracking-[-0.96px]">232</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[calc(50%-161px)] not-italic text-[48px] text-black text-nowrap top-[185px] tracking-[-0.96px]">WELCOME</p>
      </div>
      <div className="absolute bg-white h-[844px] left-[1026px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 3">
        <StatusBarText text="9:41" />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-147px)] not-italic text-[16px] text-black text-nowrap top-[326px]">During these days, you’ve logged in for</p>
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[calc(50%-117px)] not-italic text-[0px] text-[16px] text-black text-nowrap top-[447px]">
          <span className="leading-none">{`You’re the top `}</span>
          <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.4]">12%</span>
          <span className="leading-none">{` of the users`}</span>
        </p>
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-21px)] not-italic text-[16px] text-black text-nowrap top-[406px]">DAYS</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[149px] not-italic text-[48px] text-black text-nowrap top-[348px] tracking-[-0.96px]">196</p>
      </div>
      <div className="absolute bg-white h-[844px] left-[1447px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 4">
        <div className="absolute bg-[#d9d9d9] h-[111px] left-[251px] top-[141px] w-[117px]" />
        <div className="absolute bg-[#d9d9d9] h-[111px] left-[23px] top-[221px] w-[117px]" />
        <div className="absolute bg-[#d9d9d9] h-[111px] left-[171px] top-[325px] w-[117px]" />
        <div className="absolute bg-[#d9d9d9] h-[111px] left-[23px] top-[425px] w-[117px]" />
        <div className="absolute bg-[#d9d9d9] h-[111px] left-[192px] top-[526px] w-[117px]" />
        <StatusBarText text="9:41" />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-111px)] not-italic text-[16px] text-black text-nowrap top-[88px]">Let’s see your top 5 functions</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-69px)] not-italic text-[24px] text-black text-nowrap top-[180px] tracking-[-0.48px]">CHAT ROOM</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-69px)] not-italic text-[24px] text-black text-nowrap top-[262px] tracking-[-0.48px]">MIKE’S PICK</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-69px)] not-italic text-[24px] text-black text-nowrap top-[352px] tracking-[-0.48px]">CLUB</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-69px)] not-italic text-[24px] text-black text-nowrap top-[442px] tracking-[-0.48px]">MIKE’S TRADE</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-69px)] not-italic text-[24px] text-black text-nowrap top-[553px] tracking-[-0.48px]">VIDEO</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[90px] not-italic text-[48px] text-black text-nowrap top-[163px] tracking-[-0.96px]">1</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[90px] not-italic text-[48px] text-black text-nowrap top-[245px] tracking-[-0.96px]">2</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[90px] not-italic text-[48px] text-black text-nowrap top-[335px] tracking-[-0.96px]">3</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[90px] not-italic text-[48px] text-black text-nowrap top-[425px] tracking-[-0.96px]">4</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[90px] not-italic text-[48px] text-black text-nowrap top-[536px] tracking-[-0.96px]">5</p>
        <div className="absolute font-['Inter:Italic',sans-serif] font-normal italic leading-[1.4] left-[42px] text-[16px] text-black text-nowrap top-[170px]">
          <p className="mb-0">vip</p>
          <p>only</p>
        </div>
        <div className="absolute font-['Inter:Italic',sans-serif] font-normal italic leading-[1.4] left-[42px] text-[16px] text-black text-nowrap top-[252px]">
          <p className="mb-0">vip</p>
          <p>only</p>
        </div>
        <div className="absolute font-['Inter:Italic',sans-serif] font-normal italic leading-[1.4] left-[42px] text-[16px] text-black text-nowrap top-[432px]">
          <p className="mb-0">vip</p>
          <p>only</p>
        </div>
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[1.4] left-[calc(50%-116px)] not-italic text-[16px] text-black text-nowrap top-[661px]">Seems that you engage a lot!</p>
      </div>
      <div className="absolute bg-white h-[844px] left-[1868px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 5">
        <div className="absolute bg-[#d9d9d9] h-[224px] left-[202px] top-[145px] w-[188px]" />
        <div className="absolute bg-[#d9d9d9] h-[224px] left-0 top-[360px] w-[167px]" />
        <div className="absolute bg-[#d9d9d9] h-[224px] left-0 top-[620px] w-[167px]" />
        <StatusBarText text="9:41" />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-151px)] not-italic text-[16px] text-black text-nowrap top-[88px]">In this year, Mike app has improved a lot</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-151px)] not-italic text-[24px] text-black text-nowrap top-[203px] tracking-[-0.48px]">CHAT ROOM</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-10px)] not-italic text-[24px] text-black text-nowrap top-[457px] tracking-[-0.48px]">MIKE’S TRADE</p>
        <div className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%+149px)] not-italic text-[24px] text-black text-nowrap text-right top-[680px] tracking-[-0.48px] translate-x-[-100%]">
          <p className="mb-0">HOME PAGE</p>
          <p>LIVE ROOM</p>
        </div>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[44px] not-italic text-[48px] text-black text-nowrap top-[145px] tracking-[-0.96px]">Mar</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[253px] not-italic text-[48px] text-black text-nowrap top-[393px] tracking-[-0.96px]">Aug</p>
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[253px] not-italic text-[48px] text-black text-nowrap top-[622px] tracking-[-0.96px]">Nov</p>
      </div>
      <div className="absolute bg-white h-[844px] left-[2289px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 6">
        <div className="absolute bg-[#d9d9d9] h-[356px] left-[44px] top-[186px] w-[281px]" />
        <StatusBarText text="9:41" />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-151px)] not-italic text-[16px] text-black text-nowrap top-[88px]">Also, Mike strategy has a great result</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-151px)] not-italic text-[24px] text-black text-nowrap top-[145px] tracking-[-0.48px]">MIKE’S TRADE</p>
        <div className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-150px)] not-italic text-[24px] text-black text-nowrap top-[554px] tracking-[-0.48px]">
          <p className="mb-0">70% of the stocks grow</p>
          <p>over 15%</p>
        </div>
      </div>
      <div className="absolute bg-white h-[844px] left-[2697px] overflow-clip top-[302px] w-[390px]" data-name="iPhone 13 & 14 - 7">
        <div className="absolute bg-[#d9d9d9] h-[356px] left-[44px] top-[186px] w-[281px]" />
        <StatusBarText text="9:41" />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-none left-[calc(50%-151px)] not-italic text-[16px] text-black text-nowrap top-[88px]">Also, Mike strategy has a great result</p>
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-151px)] not-italic text-[24px] text-black text-nowrap top-[145px] tracking-[-0.48px]">MIKE’S PICK</p>
        <div className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[1.2] left-[calc(50%-150px)] not-italic text-[24px] text-black text-nowrap top-[554px] tracking-[-0.48px]">
          <p className="mb-0">From 2025-04-03 till now</p>
          <p className="mb-0">90% of the stocks grow</p>
          <p>over 20%</p>
        </div>
      </div>
    </div>
  );
}