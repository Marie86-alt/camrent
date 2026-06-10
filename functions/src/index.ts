import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { handleBookingCreated } from './bookings/bookingNotifications';
import { handleCancelBooking } from './bookings/cancelBooking';
import { handleCreateBooking } from './bookings/createBooking';
import {
  handleCreateIndependentDriver,
  handleCreateOwnerDriver,
  handleListAvailableDrivers,
} from './drivers/ownerDrivers';
import { assertPost, sendJson } from './http';
import { handleCitySearch } from './locations/geonames';
import { handleSendAdminNotification } from './notifications/expoPush';
import { handleMobileMoneyPayment } from './payments/mobileMoneyHandler';
import {
  handleCampayWebhook,
  handleFlutterwaveWebhook,
  handleMtnMomoWebhook,
  handleOrangeMoneyWebhook,
} from './payments/webhookHandlers';
import { handleSubmitReview } from './reviews/reviewSubmit';

export const mobileMoneyPayment = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleMobileMoneyPayment(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Payment request failed',
    });
  }
});

export const createBooking = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleCreateBooking(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Booking creation failed',
    });
  }
});

export const cancelBooking = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleCancelBooking(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Booking cancellation failed',
    });
  }
});

export const mtnMomoWebhook = onRequest(async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleMtnMomoWebhook(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'MTN webhook failed',
    });
  }
});

export const orangeMoneyWebhook = onRequest(async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleOrangeMoneyWebhook(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Orange webhook failed',
    });
  }
});

export const flutterwaveWebhook = onRequest(async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleFlutterwaveWebhook(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Flutterwave webhook failed',
    });
  }
});

export const campayWebhook = onRequest(async (request, response) => {
  try {
    await handleCampayWebhook(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Campay webhook failed',
    });
  }
});

export const sendAdminNotification = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleSendAdminNotification(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Notification send failed',
    });
  }
});

export const citySearch = onRequest({ cors: true }, async (request, response) => {
  try {
    await handleCitySearch(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'City search failed',
    });
  }
});

export const createOwnerDriver = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleCreateOwnerDriver(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Driver creation failed',
    });
  }
});

export const createIndependentDriver = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleCreateIndependentDriver(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Independent driver creation failed',
    });
  }
});

export const submitReview = onRequest({ cors: true }, async (request, response) => {
  try {
    if (!assertPost(request, response)) {
      return;
    }

    await handleSubmitReview(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Review submit failed',
    });
  }
});

export const listAvailableDrivers = onRequest({ cors: true }, async (request, response) => {
  try {
    await handleListAvailableDrivers(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Driver listing failed',
    });
  }
});

export const bookingCreatedNotification = onDocumentCreated('bookings/{bookingId}', async (event) => {
  if (!event.data) {
    return;
  }

  await handleBookingCreated(event.data);
});
