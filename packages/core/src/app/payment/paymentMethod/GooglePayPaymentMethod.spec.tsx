import { PaymentMethodId, PaymentMethodType } from '@bigcommerce/checkout-js/payment-integration';
import { createCheckoutService, CheckoutSelectors, CheckoutService, PaymentInitializeOptions, PaymentMethod } from '@bigcommerce/checkout-sdk';
import { mount, ReactWrapper } from 'enzyme';
import { Formik } from 'formik';
import each from 'jest-each';
import { noop } from 'lodash';
import React, { FunctionComponent } from 'react';

import { CheckoutProvider } from '../../checkout';
import { getStoreConfig } from '../../config/config.mock';
import { createLocaleContext, LocaleContext, LocaleContextType } from '../../locale';
import { getPaymentMethod } from '../payment-methods.mock';

import { default as PaymentMethodComponent, PaymentMethodProps } from './PaymentMethod';
import WalletButtonPaymentMethod, { WalletButtonPaymentMethodProps } from './WalletButtonPaymentMethod';

describe('when using Google Pay payment', () => {
    let method: PaymentMethod;
    let checkoutService: CheckoutService;
    let checkoutState: CheckoutSelectors;
    let defaultProps: PaymentMethodProps;
    let localeContext: LocaleContextType;
    let PaymentMethodTest: FunctionComponent<PaymentMethodProps>;

    beforeEach(() => {
        defaultProps = {
            method: getPaymentMethod(),
            onUnhandledError: jest.fn(),
        };

        checkoutService = createCheckoutService();
        checkoutState = checkoutService.getState();
        localeContext = createLocaleContext(getStoreConfig());
        method = {
            ...getPaymentMethod(),
            id: PaymentMethodId.BraintreeGooglePay,
            method: PaymentMethodType.GooglePay,
        };

        jest.spyOn(checkoutState.data, 'getConfig')
            .mockReturnValue(getStoreConfig());

        jest.spyOn(checkoutService, 'deinitializePayment')
            .mockResolvedValue(checkoutState);

        jest.spyOn(checkoutService, 'initializePayment')
            .mockResolvedValue(checkoutState);

        PaymentMethodTest = props => (
            <CheckoutProvider checkoutService={ checkoutService }>
                <LocaleContext.Provider value={ localeContext }>
                    <Formik
                        initialValues={ {} }
                        onSubmit={ noop }
                    >
                        <PaymentMethodComponent { ...props } />
                    </Formik>
                </LocaleContext.Provider>
            </CheckoutProvider>
        );
    });

    it('renders as wallet button method', () => {
        const container = mount(<PaymentMethodTest { ...defaultProps } method={ method } />);

        expect(container.find(WalletButtonPaymentMethod).props())
            .toEqual(expect.objectContaining({
                buttonId: 'walletButton',
                deinitializePayment: expect.any(Function),
                initializePayment: expect.any(Function),
                method,
                shouldShowEditButton: true,
            }));
    });

    each([
        [PaymentMethodId.AdyenV2GooglePay],
        [PaymentMethodId.AdyenV3GooglePay],
        [PaymentMethodId.AuthorizeNetGooglePay],
        [PaymentMethodId.BraintreeGooglePay],
        [PaymentMethodId.CheckoutcomGooglePay],
        [PaymentMethodId.CybersourceV2GooglePay],
        [PaymentMethodId.OrbitalGooglePay],
        [PaymentMethodId.StripeGooglePay],
        [PaymentMethodId.StripeUPEGooglePay],
    ]).it('initializes %s with required config', id => {
        method.id = id;
        const container = mount(<PaymentMethodTest { ...defaultProps } method={ method } />);
        const component: ReactWrapper<WalletButtonPaymentMethodProps> = container.find(WalletButtonPaymentMethod);

        component.prop('initializePayment')({
            methodId: method.id,
            gatewayId: method.gateway,
        });

        expect(checkoutService.initializePayment)
            .toHaveBeenCalledWith(expect.objectContaining({
                methodId: id,
                gatewayId: method.gateway,
                [id]: {
                    walletButton: 'walletButton',
                    onError: defaultProps.onUnhandledError,
                    onPaymentSelect: expect.any(Function),
                },
            }));
    });

    it('reinitializes method once payment option is selected', async () => {
        const container = mount(<PaymentMethodTest { ...defaultProps } method={ method } />);
        const component: ReactWrapper<WalletButtonPaymentMethodProps> = container.find(WalletButtonPaymentMethod);

        component.prop('initializePayment')({
            methodId: method.id,
            gatewayId: method.gateway,
        });

        const options: PaymentInitializeOptions = (checkoutService.initializePayment as jest.Mock).mock.calls[0][0];

        const paymentSelectHandler = options.googlepaybraintree?.onPaymentSelect;
        if (paymentSelectHandler) {
            paymentSelectHandler();
        }

        await new Promise(resolve => process.nextTick(resolve));

        expect(checkoutService.deinitializePayment)
            .toHaveBeenCalledWith({ methodId: method.id });
        expect(checkoutService.initializePayment)
            .toHaveBeenCalledWith(expect.objectContaining({
                methodId: method.id,
                [method.id]: expect.any(Object),
            }));
        expect(checkoutService.initializePayment)
            .toHaveBeenCalledTimes(2);
    });
});
