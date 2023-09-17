<script setup>
import { useRoute, useRouter } from "vue-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useSecretStore } from "../stores/secret";

const router = useRouter();
const route = useRoute();
const { message, secret, setMessage, setSecret } = useSecretStore();

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

onUnmounted(() => {
  setSecret(null);
  setMessage("**********");
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
        <div class="mb-3" v-if="secret">
          <label for="secret" class="text-gray-900 text-md"
            >Share this link:
            <span class="text-xs text-gray-500"
              >(you will only see this once)</span
            ></label
          >
          <input
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
            readonly
            type="text"
            name="secret"
            :value="secret"
            placeholder="secret"
          />
        </div>

        <div class="mb-3" v-if="secret">
          <label for="secret" class="text-gray-900 text-md"
            >Secret:
            <span class="text-xs text-gray-500"
              >(you will only see this once)</span
            ></label
          >
          <textarea
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
            readonly
            cols="30"
            rows="5"
            name="message"
            :value="message"
            placeholder="Message"
          ></textarea>
        </div>

        <div class="mb-3" v-else>
          <label for="secret" class="text-gray-900 text-md"
            >Secret:
            <span class="text-xs text-gray-500"
              ></span
            ></label
          >
          <input
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
            readonly
            type="text"
            name="message"
            :value="message"
            placeholder="Message"
          />
        </div>

        <div class="mb-3 text-gray-500" v-if="data.burned_at">
          <label for="lifetime" class="font-bold text-gray-900">Burned: </label>
          {{ data.burned_at.toDate().toDateString() }} @{{
            data.burned_at.toDate().toLocaleTimeString()
          }}
        </div>
        <div class="mb-3 text-gray-500" v-else-if="data.viewed_at">
          <label for="lifetime" class="font-bold text-gray-900"
            >Received:
          </label>
          {{ data.viewed_at.toDate().toDateString() }} @{{
            data.viewed_at.toDate().toLocaleTimeString()
          }}
        </div>
        <div class="mb-3 text-gray-500" v-else-if="data.expiry">
          <label for="lifetime" class="font-bold text-gray-900"
            >Expires on:
          </label>
          {{ data.expiry.toDate().toDateString() }} @{{
            data.expiry.toDate().toLocaleTimeString()
          }}
        </div>

        <div class="mb-3 text-center" v-if="!data.burned_at">
          <button
            class="text-gray-900 bg-gray-400 w-full p-2 rounded"
            @click="handleBurnLink"
          >
            Burn this secret*
          </button>
          <p class="text-md mt-1">
            * Burning a secret will delete it before it has been read (click to
            confirm).
          </p>
        </div>

        <div class="mb-3 mt-5">
          <button
            class="text-white bg-red-400 w-full p-2 rounded"
            @click="handleCreateAnotherLink"
          >
            Create another secret
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
