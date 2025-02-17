import { HostedPaymentMethodProps } from '@bigcommerce/checkout-js/payment-integration';
import { PaymentInitializeOptions } from '@bigcommerce/checkout-sdk';
import React, { useCallback, useContext, FunctionComponent } from 'react';

import { LocaleContext } from '../../locale';

import HostedPaymentMethod from './HostedPaymentMethod';

const ApplePayPaymentMethod: FunctionComponent<HostedPaymentMethodProps> = ({
    initializePayment,
    method,
    ...rest
}) => {
    const localeContext = useContext(LocaleContext);

    const initializeApplePay = useCallback((options: PaymentInitializeOptions) => initializePayment({
        ...options,
        applepay: {
            shippingLabel: localeContext?.language.translate('cart.shipping_text'),
            subtotalLabel: localeContext?.language.translate('cart.subtotal_text'),
        },
    }), [initializePayment, localeContext]);

    return <HostedPaymentMethod
        { ...rest }
        initializePayment={ initializeApplePay }
        method={ method }
    />;
};

export default ApplePayPaymentMethod;
