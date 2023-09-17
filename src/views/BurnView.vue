<script setup>
import { useRoute, useRouter } from "vue-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ref, onMounted, computed } from "vue";
import { useSecretStore } from "../stores/secret";

const router = useRouter();
const route = useRoute();
const { message, secret } = useSecretStore();

const secretID = ref("");
const heading = ref("");
const isLoading = ref(true);
const isValid = ref(false);
const data = ref({});

const getData = async (id) => {
  const secretRef = doc(db, "secrets", id);
  const secretSnap = await getDoc(secretRef);
  isLoading.value = false;
  if (secretSnap.exists()) {
    secretID.value = id;
    isValid.value = true;
    data.value = secretSnap.data();
    validateExpiry(data.value);
  } else {
    heading.value = "Unknown Secret";
    isValid.value = false;
    console.log("No such document!");
  }
};

const validateExpiry = async (data) => {
  let currentTime = new Date();
  let expiry = data?.expiry ? data?.expiry.toDate() : currentTime;
  if (expiry.getTime() < currentTime.getTime()) {
    isValid.value = false;
    heading.value = "Unknown Secret";
    await setDocData({ message: null });
    return;
  }
};

const setDocData = async (val) => {
  const secretRef = doc(db, "secrets", secretID.value);
  await setDoc(secretRef, val, { merge: true });
};

const handleBurnSecret = async () => {
  let currentTime = new Date();
  validateExpiry(data.value);
  await setDocData({ message: null, burned_at: currentTime });
  handleCancelBurnLink();
};

const handleBurnLink = () => {
  router.push({
    name: "burn",
    params: {
      id: route.params.id,
    },
  });
};

const handleCancelBurnLink = () => {
  router.push({
    name: "private",
    params: {
      id: route.params.id,
    },
  });
};

const handleCreateAnotherLink = () => {
  router.push({
    name: "home",
  });
};

onMounted(async () => {
  const privateRef = doc(db, "privates", route.params.id);
  const privateSnap = await getDoc(privateRef);
  if (privateSnap.exists()) {
    const privateDoc = privateSnap.data();
    await getData(privateDoc.secret);
  } else {
    heading.value = "Unknown Secret";
    isValid.value = false;
    isLoading.value = false;
    console.log("No such document!");
  }
});
</script>

<template>
  <main class="w-full">
    <div class="mx-auto my-8 w-2/4">
      <h1 class="text-2xl mb-3 text-center" v-if="isLoading">Loading...</h1>
      <h1 class="text-2xl mb-3" v-else>{{ heading }}</h1>

      <div v-if="!isLoading && !isValid">
        <div class="bg-yellow-200 rounded p-2 text-gray-900 mb-5">
          It either never existed or has expired.
        </div>
        <button
          class="text-white bg-red-400 w-full p-2 rounded"
          @click="handleCreateAnotherLink"
        >
          Share a secret of your own
        </button>
      </div>

      <div v-if="!isLoading && isValid">
        <div
          v-if="data.viewed_at || data.burned_at"
          class="bg-red-100 text-red-600 rounded p-2 text-gray-900 mb-5"
        >
          <strong>Cannot burn!</strong> The secret has already been burned or
          viewed
        </div>
        <div class="mb-3 mt-5" v-else>
          <button
            class="text-white bg-orange-400 w-full p-2 rounded"
            @click="handleBurnSecret"
          >
            Confirm: Burn this secret
          </button>
        </div>
        <div class="mb-3 mt-5">
          <button
            class="text-gray-900 bg-gray-400 w-full p-2 rounded"
            @click="handleCancelBurnLink"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
