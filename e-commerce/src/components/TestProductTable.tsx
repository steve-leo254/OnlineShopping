import React, { useState } from 'react';
import { CreditCard, Truck, MapPin, User, Phone, Mail, Lock, CheckCircle } from 'lucide-react';

const CheckoutPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Delivery Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    additionalInfo: '',
    city: '',
    county: '',
    isDefault: false,
    
    // Payment Information
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    paymentMethod: 'card'
  });

  // Sample cart items
  const cartItems = [
    {
      id: 1,
      name: "Wireless Bluetooth Headphones",
      price: 8500,
      quantity: 1,
      img_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop"
    },
    {
      id: 2,
      name: "Smart Watch Series 8",
      price: 25000,
      quantity: 2,
      img_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop"
    }
  ];

  const KENYAN_COUNTIES = [
    "Nairobi", "Mombasa", "Kiambu", "Nakuru", "Machakos", "Kajiado", "Murang'a", 
    "Kakamega", "Kisumu", "Meru", "Nyeri", "Uasin Gishu", "Kericho", "Bomet"
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle order submission
    alert('Order placed successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Order
          </h1>
          <p className="text-gray-600">Secure checkout process</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Delivery', icon: Truck },
              { step: 2, label: 'Payment', icon: CreditCard },
              { step: 3, label: 'Review', icon: CheckCircle }
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span className={`ml-2 font-medium ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
                {step < 3 && (
                  <div className={`w-16 h-1 ml-4 rounded-full ${
                    currentStep > step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Delivery Information */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-6">
                    <MapPin className="text-blue-600 mr-3" size={24} />
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+254712345678"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your full address"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City/Locality *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your city"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        County *
                      </label>
                      <select
                        name="county"
                        value={formData.county}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select County</option>
                        {KENYAN_COUNTIES.map(county => (
                          <option key={county} value={county}>{county}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Information
                      </label>
                      <input
                        type="text"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Apartment, suite, landmark, etc."
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={formData.isDefault}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Save as default delivery address</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-8">
                    <button
                      type="button"
                      onClick={() => handleStepChange(2)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Information */}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-6">
                    <CreditCard className="text-blue-600 mr-3" size={24} />
                    <h2 className="text-2xl font-bold text-gray-900">Payment Information</h2>
                  </div>
                  
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                        { id: 'mpesa', label: 'M-Pesa', icon: Phone },
                        { id: 'cod', label: 'Cash on Delivery', icon: Truck }
                      ].map(({ id, label, icon: Icon }) => (
                        <label key={id} className="cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={id}
                            checked={formData.paymentMethod === id}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            formData.paymentMethod === id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center">
                              <Icon className={`mr-3 ${formData.paymentMethod === id ? 'text-blue-600' : 'text-gray-400'}`} size={20} />
                              <span className={`font-medium ${formData.paymentMethod === id ? 'text-blue-600' : 'text-gray-700'}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Card Payment Form */}
                  {formData.paymentMethod === 'card' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          name="nameOnCard"
                          value={formData.nameOnCard}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Full name as on card"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="MM/YY"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* M-Pesa Payment */}
                  {formData.paymentMethod === 'mpesa' && (
                    <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center mb-4">
                        <Phone className="text-green-600 mr-3" size={24} />
                        <h3 className="text-lg font-medium text-green-900">M-Pesa Payment</h3>
                      </div>
                      <p className="text-green-700 mb-4">
                        You will receive an M-Pesa prompt on your phone to complete the payment after clicking "Place Order".
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">
                          M-Pesa Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="mpesaPhone"
                          className="w-full px-4 py-3 rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="+254712345678"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Cash on Delivery */}
                  {formData.paymentMethod === 'cod' && (
                    <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center mb-4">
                        <Truck className="text-yellow-600 mr-3" size={24} />
                        <h3 className="text-lg font-medium text-yellow-900">Cash on Delivery</h3>
                      </div>
                      <p className="text-yellow-700">
                        Pay with cash when your order is delivered. Additional delivery charges may apply.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => handleStepChange(1)}
                      className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                    >
                      Back to Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepChange(3)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                    >
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Order Review */}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-6">
                    <CheckCircle className="text-blue-600 mr-3" size={24} />
                    <h2 className="text-2xl font-bold text-gray-900">Review Your Order</h2>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                      <p className="text-gray-600">{formData.email}</p>
                      <p className="text-gray-600">{formData.phone}</p>
                      <p className="text-gray-600">{formData.address}</p>
                      <p className="text-gray-600">{formData.city}, {formData.county}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium capitalize">
                        {formData.paymentMethod === 'card' && 'Credit/Debit Card'}
                        {formData.paymentMethod === 'mpesa' && 'M-Pesa'}
                        {formData.paymentMethod === 'cod' && 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => handleStepChange(2)}
                      className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                    >
                      Back to Payment
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                    >
                      Place Order
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img 
                      src={item.img_url} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              
              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Lock size={16} />
                <span>Secure checkout protected by SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;