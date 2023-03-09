const { default: axios } = require("axios");

function calculateDistance({ lat1, long1, lat2, long2 }) {
  let R = 6371;
  let dLat = deg2rad(lat2 - lat1);
  let dLong = deg2rad(long2 - long1);

  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);

  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function signUserInPagarme({
  country,
  state,
  city,
  zipcode,
  address,
  countrycode,
  areacode,
  number,
  birthdate,
  name,
  email,
  userId,
  document,
  documenttype,
  typeUser,
  gender,
  authorization,
}) {
  const userData = await axios.post(
    "https://api.pagar.me/core/v5/customers",
    JSON.stringify({
      address: {
        country: country,
        state: state,
        city: city,
        zip_code: zipcode,
        line_1: address,
      },
      phones: {
        mobile_phone: {
          number: number,
          area_code: areacode,
          country_code: countrycode,
        },
      },
      birthdate: birthdate,
      name: name,
      email: email,
      code: userId,
      document: document,
      document_type: documenttype,
      type: typeUser,
      gender: gender,
    }),
    {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: "Basic " + authorization,
      },
    }
  );

  return userData;
}

const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

module.exports = {
  calculateDistance,
  signUserInPagarme,
  b64toBlob,
};

/* 

Usuário Compra -> Criado Solicitação de Aprovação por Parte do Artista cadastrado
      -> Aprovado -> Continua processo de Pagamento do usuário
      -> Cancelado/Rejeitado -> Retorno de Motivo para o Usuário

*/
