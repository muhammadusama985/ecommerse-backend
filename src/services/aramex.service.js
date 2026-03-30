import { env } from "../config/env.js";

function isAramexConfigured() {
  return Boolean(
    env.aramexUsername &&
      env.aramexPassword &&
      env.aramexAccountNumber &&
      env.aramexAccountPin &&
      env.aramexAccountEntity &&
      env.aramexAccountCountryCode,
  );
}

function getClientInfo() {
  return {
    UserName: env.aramexUsername,
    Password: env.aramexPassword,
    Version: "v1.0",
    AccountNumber: env.aramexAccountNumber,
    AccountPin: env.aramexAccountPin,
    AccountEntity: env.aramexAccountEntity,
    AccountCountryCode: env.aramexAccountCountryCode,
    Source: 24,
  };
}

function buildParty({
  name,
  company,
  phone,
  email,
  addressLine1,
  city,
  countryCode,
  postalCode,
}) {
  return {
    Reference1: "",
    AccountNumber: "",
    PartyAddress: {
      Line1: addressLine1,
      City: city,
      CountryCode: countryCode,
      PostCode: postalCode || "",
    },
    Contact: {
      PersonName: name,
      CompanyName: company || name,
      PhoneNumber1: phone,
      EmailAddress: email || "",
    },
  };
}

function buildShipmentPayload({
  reference,
  shipper,
  consignee,
  description,
  goodsOriginCountry,
  pieces,
  weight,
}) {
  return {
    ClientInfo: getClientInfo(),
    LabelInfo: {
      ReportID: 9729,
      ReportType: "URL",
    },
    Shipments: [
      {
        Reference1: reference,
        Shipper: shipper,
        Consignee: consignee,
        ShippingDateTime: new Date().toISOString(),
        DueDate: new Date().toISOString(),
        Details: {
          Dimensions: {
            Length: 10,
            Width: 10,
            Height: 10,
            Unit: "CM",
          },
          ActualWeight: {
            Unit: "KG",
            Value: weight,
          },
          ProductGroup: "DOM",
          ProductType: "OND",
          PaymentType: "P",
          NumberOfPieces: pieces,
          DescriptionOfGoods: description,
          GoodsOriginCountry: goodsOriginCountry,
        },
      },
    ],
  };
}

function normalizeCountryCode(value) {
  if (typeof value === "string" && value.trim().length === 2) {
    return value.trim().toUpperCase();
  }

  return "AE";
}

async function callAramex(path, payload) {
  const response = await fetch(`${env.aramexBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Aramex request failed: ${message}`);
  }

  const data = await response.json();

  if (data.HasErrors) {
    const notification = Array.isArray(data.Notifications)
      ? data.Notifications.map((item) => item.Message).filter(Boolean).join(", ")
      : "Aramex returned an error.";
    throw new Error(notification);
  }

  return data;
}

async function calculateAramexRate({ address, items, actualWeight = 0.5 }) {
  if (!isAramexConfigured()) {
    return {
      provider: "aramex",
      configured: false,
      shippingAmount: 0,
      currency: "AED",
      raw: null,
    };
  }

  const payload = {
    ClientInfo: getClientInfo(),
    OriginAddress: {
      Line1: env.aramexShipperAddressLine1,
      City: env.aramexShipperCity,
      CountryCode: env.aramexShipperCountryCode,
      PostCode: env.aramexShipperPostalCode,
    },
    DestinationAddress: {
      Line1: address.addressLine1,
      City: address.city,
      CountryCode: normalizeCountryCode(address.country),
      PostCode: address.postalCode || "",
    },
    ShipmentDetails: {
      PaymentType: "P",
      ProductGroup: "DOM",
      ProductType: "OND",
      ActualWeight: {
        Unit: "KG",
        Value: Math.max(actualWeight, Number((items.length * 0.3).toFixed(2))),
      },
      NumberOfPieces: items.reduce((sum, item) => sum + item.quantity, 0),
      Services: "",
    },
  };

  const response = await callAramex(
    "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate",
    payload,
  );

  return {
    provider: "aramex",
    configured: true,
    shippingAmount: Number(response.TotalAmount?.Value || 0),
    currency: response.TotalAmount?.CurrencyCode || "AED",
    raw: response,
  };
}

async function createAramexShipment({ order }) {
  if (!isAramexConfigured()) {
    const error = new Error("Aramex is not configured yet.");
    error.statusCode = 500;
    throw error;
  }

  const shipper = buildParty({
    name: env.aramexShipperName,
    company: env.aramexShipperCompany,
    phone: env.aramexShipperPhone,
    email: env.aramexShipperEmail,
    addressLine1: env.aramexShipperAddressLine1,
    city: env.aramexShipperCity,
    countryCode: env.aramexShipperCountryCode,
    postalCode: env.aramexShipperPostalCode,
  });

  const consignee = buildParty({
    name: order.shippingAddress.fullName,
    company: order.shippingAddress.fullName,
    phone: order.shippingAddress.phone,
    email: "",
    addressLine1: order.shippingAddress.addressLine1,
    city: order.shippingAddress.city,
    countryCode: normalizeCountryCode(order.shippingAddress.country),
    postalCode: order.shippingAddress.postalCode,
  });

  const payload = buildShipmentPayload({
    reference: order.orderNumber,
    shipper,
    consignee,
    description: order.items.map((item) => item.name).join(", ").slice(0, 95),
    goodsOriginCountry: env.aramexShipperCountryCode,
    pieces: order.items.reduce((sum, item) => sum + item.quantity, 0),
    weight: Math.max(0.5, Number((order.items.length * 0.3).toFixed(2))),
  });

  const response = await callAramex(
    "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments",
    payload,
  );

  const processedShipment = response.Shipments?.[0] || {};
  const labelUrl = response.ShipmentsLabels?.[0]?.LabelURL || "";

  return {
    provider: "aramex",
    trackingNumber: processedShipment.ID || processedShipment.TrackingNumber || "",
    shipmentReference: processedShipment.Reference1 || order.orderNumber,
    labelUrl,
    raw: response,
  };
}

async function createAramexReturnShipment({ order }) {
  if (!isAramexConfigured()) {
    const error = new Error("Aramex is not configured yet.");
    error.statusCode = 500;
    throw error;
  }

  const customerParty = buildParty({
    name: order.shippingAddress.fullName,
    company: order.shippingAddress.fullName,
    phone: order.shippingAddress.phone,
    email: order.userEmail || "",
    addressLine1: order.shippingAddress.addressLine1,
    city: order.shippingAddress.city,
    countryCode: normalizeCountryCode(order.shippingAddress.country),
    postalCode: order.shippingAddress.postalCode,
  });

  const warehouseParty = buildParty({
    name: env.aramexShipperName,
    company: env.aramexShipperCompany,
    phone: env.aramexShipperPhone,
    email: env.aramexShipperEmail,
    addressLine1: env.aramexShipperAddressLine1,
    city: env.aramexShipperCity,
    countryCode: env.aramexShipperCountryCode,
    postalCode: env.aramexShipperPostalCode,
  });

  const payload = buildShipmentPayload({
    reference: `${order.orderNumber}-RETURN`,
    shipper: customerParty,
    consignee: warehouseParty,
    description: `Return for ${order.orderNumber}`.slice(0, 95),
    goodsOriginCountry: normalizeCountryCode(order.shippingAddress.country),
    pieces: order.items.reduce((sum, item) => sum + item.quantity, 0),
    weight: Math.max(0.5, Number((order.items.length * 0.3).toFixed(2))),
  });

  const response = await callAramex(
    "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments",
    payload,
  );

  const processedShipment = response.Shipments?.[0] || {};
  const labelUrl = response.ShipmentsLabels?.[0]?.LabelURL || "";

  return {
    provider: "aramex",
    trackingNumber: processedShipment.ID || processedShipment.TrackingNumber || "",
    shipmentReference: processedShipment.Reference1 || `${order.orderNumber}-RETURN`,
    labelUrl,
    raw: response,
  };
}

async function trackAramexShipment({ trackingNumber }) {
  if (!isAramexConfigured()) {
    const error = new Error("Aramex is not configured yet.");
    error.statusCode = 500;
    throw error;
  }

  const response = await callAramex(
    "/TrackingAPI.V1/Service_1_0.svc/json/TrackShipments",
    {
      ClientInfo: getClientInfo(),
      Shipments: [trackingNumber],
      GetLastTrackingUpdateOnly: false,
    },
  );

  return response;
}

export { isAramexConfigured, calculateAramexRate, createAramexShipment, createAramexReturnShipment, trackAramexShipment };
