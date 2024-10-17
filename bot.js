import { InlineKeyboard, Api, Bot, Context } from "grammy";
import * as schedule from "node-cron";
import * as cheerio from "cheerio";
import axios from "axios";
import "dotenv/config";
const BOT_DEVELOPER = 119250289; // bot developer chat identifier

const url = "https://www.dzrt.com/en-sa/category/nicotine-pouches";
let proudct_detailes = [];
const bot = new Bot(process.env.Bot_Token);
let groups = [];
// products detaile get info name,img,available
async function getProudctsDt() {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    $(
      "body > div > main > div > div > div.container.overflow-hidden.mt-3\\.5.lg\\:mt-10 > div.grid.grid-cols-2.gap-3.lg\\:grid-cols-5.lg\\:gap-6",
    ).each((i, proudct) => {
      const pName = $(proudct).extract({
        name: ["div>a>div>span:first-of-type"],
      });
      const pStock = $(proudct).extract({
        available: ["div>a>span:first-of-type"],
      });
      proudct_detailes.push({
        name: pName.name,
        available: pStock.available,
      });
    });
  } catch (err) {
    console.error("Error fetching data : ", err);
  }
}

let check_avaliblity = async () => {
  await getProudctsDt();
  const is_avaliable = [];
  const unavaliable = [];
  for (let i = 0; i < proudct_detailes.length; i++) {
    if (proudct_detailes[0]?.available !== "OUT OF STOCK") {
      is_avaliable.push(proudct_detailes[0]?.name[i] + " ✅");
    } else {
      //FIX: dosen't push unavaliable to arr
      unavaliable.push(proudct_detailes[0]?.name[i] + " ❌");
    }
  }
  return { is_avaliable, unavaliable };
};
//is group chat id allowed ?
const is_allowed = (chatId) => {
  console.log("checking groups:", chatId);
  return groups.includes(chatId);
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
  if (groups.includes(ctx.chatId) || BOT_DEVELOPER) {
    try {
      const { is_avaliable, unavaliable } = await check_avaliblity();
      if ((is_avaliable, unavaliable)) {
        const inlineKeyboard = new InlineKeyboard();
        is_avaliable.forEach((produc) => {
          inlineKeyboard.url(produc, url).row();
        });
        unavaliable.forEach((product) => {
          inlineKeyboard.url(product, url).row();
        });
        await ctx.replyWithPhoto(
          "https://cdn.salla.sa/aqWbl/jwhDdVs7frRzBxFBof7Hrn9C6bi1lCrjFsFc1ppJ.jpg",
          {
            caption: `🎉 تم تفعيل التنبيهات التلقائية للبوت، حاليها هذه هي المنتجات المتوفرة\n وفي حالي توفر اي منتجات اخرى سيرسل البوت تنبيه`,
            reply_markup: inlineKeyboard,
          },
        );
        //TODO: make it every 30 min
        schedule.schedule("*/1 * * * *", async () => {
          // check the proudct available every 30 mins
          try {
            await check_avaliblity();
            console.log("check_avaliblity every 30 min");
            await ctx.replyWithPhoto(
              "https://cdn.salla.sa/aqWbl/jwhDdVs7frRzBxFBof7Hrn9C6bi1lCrjFsFc1ppJ.jpg",
              {
                caption: `المنتجات الممتوفرة الان، اطلبها من الموقع الرسمي`,
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
