import React from 'react';

const STEPS = [
  { key: 'ordered', label: 'Sipariş Verildi', icon: '📋' },
  { key: 'packing', label: 'Paketleniyor', icon: '📦' },
  { key: 'shipping', label: 'Yolda', icon: '🚚' },
  { key: 'delivered', label: 'Teslim Edildi', icon: '✅' },
];

export default function ShipmentTracker({ currentStep = 1 }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-paw-border" />
        <div
          className="absolute top-5 left-8 h-0.5 bg-paw-orange rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - 12)}%` }}
        />
        {STEPS.map((step, i) => {
          const isCompleted = i <= currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10" id={`shipment-step-${step.key}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                isCompleted
                  ? isCurrent
                    ? 'bg-paw-orange text-white shadow-md shadow-paw-orange/30 ring-4 ring-paw-orange/10 scale-110'
                    : 'bg-paw-green-light border-2 border-paw-green text-paw-green'
                  : 'bg-paw-bg-muted border border-paw-border text-paw-text-muted'
              }`}>
                {isCompleted && !isCurrent ? '✓' : step.icon}
              </div>
              <span className={`mt-2 text-[10px] font-medium text-center ${
                isCompleted ? (isCurrent ? 'text-paw-orange' : 'text-paw-green') : 'text-paw-text-muted'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
