<script setup>
import { ref, computed } from "vue";
import { collection, addDoc, setDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { db } from "../firebase";
import { useRouter } from "vue-router";

import { useSecretStore } from "../stores/secret";

const router = useRouter();
const { setMessage, setSecret } = useSecretStore();

const message = ref("");
const passphrase = ref("");
const expiry = ref(604800);
const isLoading = ref(false);
const isError = ref(false);

const passHash = computed(() => {
  var hash = passphrase.value.trim()
    ? CryptoJS.SHA256(passphrase.value).toString(CryptoJS.enc.Base64)
    : null;
  return hash;
});

const handleCreateLink = async () => {
  isLoading.value = true;
  isError.value = false;
  if (message.value.trim() == "") {
    isLoading.value = false;
    isError.value = true;
    return false;
  }
  let exp = new Date();
  exp.setTime(exp.getTime() + expiry.value * 1000);
  var encrypted = CryptoJS.AES.encrypt(
    message.value,
    passphrase.value
  ).toString();

  try {
    const secretRef = await addDoc(collection(db, "secrets"), {
      message: encrypted,
      passphrase: passHash.value,
      expiry: exp,
      viewed_at: null,
      burned_at: null,
      created_at: new Date(),
    });
    const privateRef = await addDoc(collection(db, "privates"), {
      secret: secretRef.id,
    });
    await setDoc(secretRef, { private: privateRef.id }, { merge: true });
    setSecret(location.origin + `/secret/` + secretRef.id);
    setMessage(message.value);
    router.push({
      name: "private",
      params: {
        id: privateRef.id,
      },
    });
  } catch (e) {
    isLoading.value = false;
    console.error("Error adding document: ", e);
  }
};
</script>

<template>
  <main class="w-full">
    <div class="mx-auto my-8 w-2/3" v-if="isLoading">
      <h1 class="text-2xl mb-3 text-center">Loading...</h1>
    </div>
    <div class="mx-auto my-8 w-2/3" v-else>
      <div class="text-center mb-6">
        <h2 class="text-2xl">
          Paste a password, secret message or private link below.
        </h2>
        <h3 class="text-lg text-gray-500">
          Keep sensitive info out of your email and chat logs.
        </h3>
      </div>
      <div class="mb-6">
        <p class="bg-red-300 rounded p-2 text-gray-900 mb-5" v-if="isError">
          Oops! You did not provide anything to share
        </p>
        <textarea
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
          placeholder="Secret content goes here..."
          name="message"
          cols="30"
          rows="10"
          v-model="message"
        ></textarea>
      </div>
      <div class="mb-6 border p-6 pt-14 relative rounded overflow-hidden">
        <div class="absolute top-0 left-0 p-2 rounded-br-md bg-gray-200">
          Privacy Option:
        </div>

        <div class="mb-2">
          <label for="passphrase" class="text-gray-900">Passphrase:</label>
          <input
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
            type="text"
            name="passphrase"
            v-model="passphrase"
            placeholder="A word or phrase that's difficult to guess"
          />
        </div>
        <div class="mb-2">
          <label for="expiry" class="text-gray-900">Lifetime:</label>
          <select
            name="expiry"
            v-model="expiry"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded block w-full p-2.5"
          >
            <option value="300">5 mins</option>
            <option value="600">10 mins</option>
            <option value="3600">1 hr</option>
            <option value="86400">1 day</option>
            <option value="604800">7 days</option>
          </select>
        </div>
      </div>
      <div class="mb-6"></div>

      <div class="mb-6">
        <button
          @click="handleCreateLink"
          class="text-white bg-red-400 w-full p-2 rounded"
        >
          Create a secret link
        </button>
      </div>
    </div>
  </main>
</template>
