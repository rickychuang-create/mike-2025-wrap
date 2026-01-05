import img241002MikeLogo11 from "figma:asset/d57d693633442a44f03716930d11ff0841c8f43c.png";
import img241002MikeLogo021 from "figma:asset/f4e17126864ba52b0b3f0ebb7b416e5bc99b02ff.png";
import img241001MikeLogo031 from "figma:asset/41bd074b7738775c2fbfb53b45e94d2726cdfbd1.png";

export default function MikeLogoA() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="Mike-LOGO-A">
      <div className="h-[1080px] relative shrink-0 w-[1920px]" data-name="24-1002-Mike-LOGO_工作區域 1 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={img241002MikeLogo11} />
      </div>
      <div className="h-[1080px] relative shrink-0 w-[1920px]" data-name="24-1002-Mike-LOGO-02 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={img241002MikeLogo021} />
      </div>
      <div className="h-[1080px] relative shrink-0 w-[1920px]" data-name="24-1001-Mike-LOGO-03 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={img241001MikeLogo031} />
      </div>
    </div>
  );
}