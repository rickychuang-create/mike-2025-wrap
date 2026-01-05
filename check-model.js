import 'dotenv/config'; // 用這行取代 require('dotenv').config()
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testConnection() {
  const apiKey = process.env.MIKE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ 錯誤：找不到 API Key，請確認 .env 檔案中有設定 GEMINI_API_KEY");
    return;
  }

  console.log("🔑 API Key 讀取成功 (前四碼):", apiKey.substring(0, 4));
  
  const genAI = new GoogleGenerativeAI(apiKey);

  // 我們來測試具體的穩定版型號
  const modelName = "gemini-1.5-flash-001"; 

  console.log(`🤖 正在嘗試連線模型: ${modelName} ...`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ 測試成功！API 連線正常。");
    console.log("📝 模型回應:", text);
    
  } catch (error) {
    console.error("❌ 測試失敗。");
    console.error("錯誤代碼:", error.message);
    
    if (error.message.includes("404")) {
        console.log("\n💡 建議：錯誤顯示 404，代表 Key 是對的，但模型名稱不支援。");
        console.log("請嘗試將程式碼中的 'gemini-1.5-flash' 改為 'gemini-1.5-flash-001' 或 'gemini-1.5-flash-002'");
    }
  }
}

testConnection();