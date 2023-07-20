import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { searchPlugin } from "@vuepress/plugin-search";
import { registerComponentsPlugin } from "@vuepress/plugin-register-components";
import { getDirname, path } from "@vuepress/utils";

const __dirname = getDirname(import.meta.url);

//自定义用户设置
export default defineUserConfig({
  base: "/mynotes/",
  
  //多语言设置
  locales:{
    "/":{
      lang: "zh-CN",
      title: "昭晞的小破站",
      description: "昭晞的学习小站",
      //设置favicon
      head:[["link",{rel:"icon",href:"/favicon.ico"}]]
    },
  },

  //主题设置
  theme,
  //插件配置
  plugins: [
    //注册全局组件的插件
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, "./components"),
    }),
    //搜索插件
    // searchPlugin({
    //   //多语言支持
    //   locales:{
    //     '/':{
    //       placeholder:'搜索本站',
    //     },
    //   },
    //   //热键支持
    //   hotKeys:["command","k"],
    //   //最大推荐数
    //   maxSuggestions:7,
    //   //排除首页
    //   isSearchable:(page)=>page.path !=='/',
    // }),
  ],
  // Enable it with pwa
  shouldPrefetch: false,
});
