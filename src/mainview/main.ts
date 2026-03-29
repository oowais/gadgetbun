import "@/mainview/app.css";
import App from "@/mainview/App.vue";
import type { AppRPC } from "@/shared/types";
import { Electroview } from "electrobun/view";
import { createApp } from "vue";

const rpc = Electroview.defineRPC<AppRPC>({
  handlers: {
    requests: {},
    messages: {},
  },
});

const electrobun = new Electroview({ rpc });

const app = createApp(App);
app.provide("rpc", electrobun.rpc);
app.mount("#app");
