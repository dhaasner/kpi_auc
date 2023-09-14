import {when} from 'mobx';

import {
  getSubscription,
} from 'js/account/stripe.api';
import {ACTIVE_STRIPE_STATUSES} from 'js/constants';
import envStore from 'js/envStore';

// check if the currently logged-in user has a paid subscription in an active status
// promise returns a boolean, or `null` if Stripe is not active - we check for the existence of `stripe_public_key`
export async function hasActiveSubscription() {
  const subscription = await getSubscription();
  if (!subscription?.count) {
    return false;
  }
  await when(() => envStore.isReady);
  if (!envStore.data.stripe_public_key) {
    return null;
  }

  return subscription.results.filter((sub) => (
      ACTIVE_STRIPE_STATUSES.includes(sub.status) &&
      sub.items?.[0].price.unit_amount > 0
    )).length > 0;
}