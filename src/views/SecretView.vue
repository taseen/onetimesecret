<script setup>
import CryptoJS from "crypto-js";
import { useRoute, useRouter } from "vue-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ref, onMounted, computed } from "vue";

const router = useRouter();
const route = useRoute();
const heading = ref("Unknown Secret");
const isLoading = ref(true);
const isValid = ref(false);
const isError = ref(false);
const message = ref("");
const passphrase = ref("");
const data = ref({});

const passHash = computed(() => {
  var hash = passphrase.value.trim()
    ? CryptoJS.SHA256(passphrase.value).toString(CryptoJS.enc.Base64)
    : null;
  return hash;
});

const getData = (data) => {
  isLoading.value = false;
  let currentTime = new Date();
  let expiry = data?.expiry ? data?.expiry.toDate() : currentTime;
  if (
    data.notExist ||
    data?.viewed_at ||
    data?.burned_at ||
    expiry.getTime() < currentTime.getTime()
  ) {
    isValid.value = false;
    heading.value = "Unknown Secret";
  } else {
    isValid.value = true;
    if (data?.passphrase) {
      heading.value = "This message requires a passphrase:";
    } else {
      heading.value = "Click to continue:";
    }
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

const setDocData = async (data) => {
  const secretRef = doc(db, "secrets", route.params.id);
  await setDoc(secretRef, data, { merge: true });
};

const handleRestoreMsg = () => {
  let currentTime = new Date();
  validateExpiry(data.value);
  if (passHash.value == data.value.passphrase) {
    isError.value = false;
    var decrypted = CryptoJS.AES.decrypt(
      data.value.message,
      passphrase.value
    ).toString(CryptoJS.enc.Utf8);
    console.log(decrypted);
    setDocData({ message: null, viewed_at: currentTime });
    heading.value = "This message is for you:";
    message.value = decrypted;
  } else {
    isError.value = true;
    passphrase.value = "";
  }
};

const handleCreateAnotherLink = () => {
  router.push({
    name: "home",
  });
};

onMounted(async () => {
  const docRef = doc(db, "secrets", route.params.id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    data.value = docSnap.data();
    getData(data.value);
    console.log("Document data:", docSnap.data());
  } else {
    getData({ notExist: true });
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
          It either never existed or has already been viewed.
        </div>
        <button
          class="text-white bg-red-400 w-full p-2 rounded"
          @click="handleCreateAnotherLink"
        >
          Share a secret of your own
        </button>
      </div>

      <div v-if="!isLoading && isValid">
        <div class="mb-6" v-if="message">
          <div class="p-2 bg-gray-300 border overflow-hidden">
            <textarea
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
              placeholder="Secret content goes here..."
              name="message"
              cols="30"
              rows="10"
              readonly
              v-model="message"
            ></textarea>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            (careful: we will only show it once.)
          </p>
          <div class="mb-3 mt-5">
            <button
              class="text-white bg-red-400 w-full p-2 rounded"
              @click="handleCreateAnotherLink"
            >
              Reply with another secret
            </button>
          </div>
        </div>
        <div class="mb-6" v-if="data.passphrase && !message">
          <p class="bg-red-300 rounded p-2 text-gray-900 mb-5" v-if="isError">
            Oops! Double check that passphrase
          </p>
          <input
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
            type="text"
            name="passphrase"
            v-model="passphrase"
            placeholder="Enter the passphrase here"
          />
        </div>
        <div class="mb-6" v-if="!message">
          <button
            class="text-white bg-red-400 w-full p-2 rounded"
            @click="handleRestoreMsg"
          >
            View Secret
          </button>
          <p class="text-xs text-gray-500 mt-2">
            (careful: we will only show it once.)
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
