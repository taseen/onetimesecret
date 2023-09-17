import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/private/:id",
      name: "private",
      component: () => import("../views/PrivateView.vue"),
    },
    {
      path: "/private/:id/burn",
      name: "burn",
      component: () => import("../views/BurnView.vue"),
    },
    {
      path: "/secret/:id",
      name: "secret",
      component: () => import("../views/SecretView.vue"),
    },
  ],
});

export default router;
