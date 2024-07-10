import CryptoJS from "crypto-js";

export const decryptData = (encryptedData) => {
  const decryptedData = CryptoJS.AES.decrypt(
    encryptedData,
    "secret key"
  ).toString(CryptoJS.enc.Utf8);
  // console.log(decryptedData);
  return decryptedData;
};
