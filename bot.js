import { InlineKeyboard, Api, Bot, Context } from "grammy";
import * as schedule from "node-cron";
import * as cheerio from "cheerio";
import axios from "axios";
import "dotenv/config";
const BOT_DEVELOPER = 119250289; // bot developer chat identifier
let product_dt = [];
const url = [
  "https://www.dzrt.com/en-sa/products/icy-rush",
  "https://www.dzrt.com/en-sa/products/seaside-frost",
  "https://www.dzrt.com/en-sa/products/samra",
  "https://www.dzrt.com/en-sa/products/highland-berries",
  "https://www.dzrt.com/en-sa/products/mint-fusion",
  "https://www.dzrt.com/en-sa/products/purple-mist",
  "https://www.dzrt.com/en-sa/products/edgy-mint",
  "https://www.dzrt.com/en-sa/products/mojito",
  "https://www.dzrt.com/en-sa/products/garden-mint",
  "https://www.dzrt.com/en-sa/products/tamra",
  "https://www.dzrt.com/en-sa/products/spicy-zest",
];
const bot = new Bot(process.env.Bot_Token);
let groups = [];
// products detaile get info name,img,available
let getProudctsDt = async () => {
  try {
    for (const product of url) {
      const { data: html } = await axios.get(product);
      const $ = cheerio.load(html);
      const div =
        "body > div.flex.min-h-screen.w-full.flex-col > main > div > div > div.flex.max-w-320.flex-col.mx-auto.mb-10.lg\\:px-5 > div.flex.flex-col.lg\\:grid.lg\\:grid-cols-2.lg\\:gap-6";
      const pName = $(div).find("div>div>h1:first-of-type").text();
      const available = $(div).find("div>span:contains('OUT OF STOCK')").text();
      product_dt.push({
        name: pName,
        available,
        url: product,
      });
    }
    return product_dt;
  } catch (err) {
    console.error("Error fetching data : ", err);
  }
};

let check_avaliblity = async () => {
  await getProudctsDt();
  const is_avaliable = [];
  const unavaliable = [];
  const data = product_dt;
  for (const product of data) {
    if (product.available === "") {
      is_avaliable.push({
        name: product.name,
        url: product.url,
      });
    } else {
      unavaliable.push({
        name: product.name,
        url: product.url,
      });
    }
  }
  return { is_avaliable, unavaliable };
};
//is group chat id allowed ?
const is_allowed = (chatId) => {
  console.log("checking groups:", chatId);
  return groups.includes(is_allowed);
};
// Set custom properties on context objects.
bot.use(async (ctx, next) => {
  ctx.config = {
    botDeveloper: BOT_DEVELOPER,
    isDeveloper: ctx.from.id === BOT_DEVELOPER,
  };
  await next();
});
//
// Define handlers for custom context objects.
bot.command("start", async (ctx) => {
  await bot.api.setMyCommands([
    {
      command: "start",
      description: "to start the bot",
      command: "dev",
      description: "only for developer",
    },
  ]);
  //start inlineKeyboard when bot starts
  const inlineKeyboard = new InlineKeyboard()
    .url(`القناة الخاصة للتنبيهات`, "https://t.me/+VaChk04R5FczYmNk")
    .row()
    .text("التواصل مع المطور للاشتراك ", "dev")
    .row()
    .text("تفعيل تنبيهات البوت", "notfiy");
  // NOTE: add sub button
  // .row()
  // .text("اشتراك", "sub");
  await ctx.replyWithPhoto(
    "https://cdn.salla.sa/aqWbl/jwhDdVs7frRzBxFBof7Hrn9C6bi1lCrjFsFc1ppJ.jpg",
    {
      caption: `هلا ${ctx.from.first_name} \n بوت تنبيهات دزرت ينبهك كل ماتوفر منتج من دزرت \n اشترك اللحين ولا تخلي المنتجات تفوتك 🔔\n قيمة الاشتراك : 15 ريال لمدة 3 شهور`,
      reply_markup: inlineKeyboard,
    },
  );
});
// add groups command
bot.command("add", async (ctx) => {
  if (ctx.from.id === BOT_DEVELOPER) {
    const chatId = ctx.message.text;
    await ctx.reply(" send group id to add ");
    groups.push(chatId);
    await ctx.reply(`done add ${chatId} to list`);
  } else {
    await ctx.reply("this comman only for admin ");
  }
});
//FIX: when i add group via /add the bot can't join group
// bot.on(":new_chat_members", async (ctx) => {
//   try {
//     if (ctx.me && is_allowed(ctx.chat.id)) {
//       await ctx.reply(
//         `انضم ${ctx.me.first_name} الى المجموعة \n سيتم ارسال تنبيهات توفر منتجات دزرت في حال توفرها  `,
//       );
//     } else {
//       await ctx.reply("لايمكنك ااضافة البوت الا بعد الاشتراك");
//       await ctx.leaveChat();
//     }
//   } catch (err) {
//     console.error("error joining group: ", err);
//   }
// });
// handel dev command
bot.command("dev", async (ctx) => {
  if (ctx.from.id === BOT_DEVELOPER) {
    ctx.reply("hi admin ");
    if (ctx.from.id === BOT_DEVELOPER) {
      const updates = await bot.api.getUpdates({ limit: 100 });

      const userNames = updates.map(
        (update) =>
          update.message?.from?.username ||
          update.message?.from?.first_name ||
          "Unknown",
      );

      const uniqueUserNames = [...new Set(userNames)];

      ctx.reply(
        `usercounts: ${uniqueUserNames.length}\nhandlers: ${uniqueUserNames.join(", ")}`,
      );
    }
  } else {
    ctx.reply("هذا الامر خاص فقط بالمطور @d7g_x ☺️");
  }
});
// callbackQuery when press the button on InlineKeyboard
bot.callbackQuery("dev", async (ctx) => {
  await ctx.reply("تم برمجة وتطوير البوت من قبل @d7g_x");
});
// TODO: subscribe with stc pay & wire transfer
// bot.callbackQuery("sub", async (ctx)=>{
//
// })
bot.callbackQuery("notfiy", async (ctx) => {
  if (ctx.chatId !== 1) {
    try {
      const { is_avaliable, unavaliable } = await check_avaliblity();
      if ((is_avaliable, unavaliable)) {
        const inlineKeyboard = new InlineKeyboard();
        is_avaliable.forEach((produc) => {
          inlineKeyboard.url(`${produc.name} ✅`, produc.url).row();
        });
        unavaliable.forEach((product) => {
          inlineKeyboard.url(`${product.name} ❌`, product.url).row();
        });
        await ctx.replyWithPhoto(
          "https://cdn.salla.sa/aqWbl/jwhDdVs7frRzBxFBof7Hrn9C6bi1lCrjFsFc1ppJ.jpg",
          {
            caption: `🎉 تم تفعيل التنبيهات التلقائية للبوت، حاليا هذه هي المنتجات المتوفرة\n وفي حال توفر اي منتجات اخرى سيرسل البوت تنبيه`,
            reply_markup: inlineKeyboard,
          },
        );
        //TODO: make it every 30 min
        schedule.schedule("*/56 * * * *", async () => {
          // check the proudct available every 30 mins
          try {
            await check_avaliblity();
            console.log("check_avaliblity Corn Task ");
            await ctx.replyWithPhoto(
              "https://cdn.salla.sa/aqWbl/jwhDdVs7frRzBxFBof7Hrn9C6bi1lCrjFsFc1ppJ.jpg",
              {
                caption: `المنتجات المتوفرة الان، اطلبها من الموقع الرسمي`,
                reply_markup: inlineKeyboard,
              },
            );
          } catch (err) {
            console.warn("err corn job ", err);
          }
        });
      } else {
        await ctx.reply(
          "لايوجد ممنتج متوفر الان، عند توفر منتج سيقوم البوت بارسال تنبيهالى القناة ☺️",
        );
      }
    } catch (err) {
      console.error("errorr fetching available:", err);
    }
  } else {
    await ctx.reply("تفعيل التنبيهات فقط للمشتركين ");
  }
});
bot.start();
console.log("bot is running...");
