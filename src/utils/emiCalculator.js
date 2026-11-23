/**
 * Kinglet Furniture - Official Bank EMI Schedule & Calculator
 *
 * Rates according to official Bangladeshi Banking & Payment Gateway schedule:
 *  - 3 Months:  6.00%
 *  - 6 Months:  6.50%
 *  - 9 Months:  6.95%
 *  - 12 Months: 9.29%
 *  - 18 Months: 12.99%
 *  - 24 Months: 18.34%
 *  - 30 Months: 19.76%
 *  - 36 Months: 24.22%
 */

export const EMI_PLANS = [
  { tenure: 3, label: "3 Months", rate: 6.00 },
  { tenure: 6, label: "6 Months", rate: 6.50 },
  { tenure: 9, label: "9 Months", rate: 6.95 },
  { tenure: 12, label: "12 Months", rate: 9.29 },
  { tenure: 18, label: "18 Months", rate: 12.99 },
  { tenure: 24, label: "24 Months", rate: 18.34 },
  { tenure: 30, label: "30 Months", rate: 19.76 },
  { tenure: 36, label: "36 Months", rate: 24.22 },
];

export const BD_BANKS = [
  { id: "city", name: "City Bank (American Express)", maxMonths: 36, logo: "/images/banks/city.svg" },
  { id: "brac", name: "BRAC Bank Limited", maxMonths: 36, logo: "/images/banks/brac.svg" },
  { id: "scb", name: "Standard Chartered Bank (SCB)", maxMonths: 36, logo: "/images/banks/scb.svg" },
  { id: "ebl", name: "Eastern Bank Limited (EBL)", maxMonths: 36, logo: "/images/banks/ebl.svg" },
  { id: "dbbl", name: "Dutch-Bangla Bank (DBBL)", maxMonths: 24, logo: "/images/banks/dbbl.svg" },
  { id: "mtb", name: "Mutual Trust Bank (MTB)", maxMonths: 36, logo: "/images/banks/mtb.svg" },
  { id: "prime", name: "Prime Bank Limited", maxMonths: 36, logo: "/images/banks/prime.svg" },
  { id: "ucb", name: "United Commercial Bank (UCB)", maxMonths: 36, logo: "/images/banks/ucb.svg" },
  { id: "dhaka", name: "Dhaka Bank", maxMonths: 24, logo: "/images/banks/dhaka.svg" },
  { id: "lanka", name: "LankaBangla Finance", maxMonths: 36, logo: "/images/banks/lanka.svg" },
  { id: "sebl", name: "Southeast Bank Limited", maxMonths: 24, logo: "/images/banks/sebl.svg" },
  { id: "ncc", name: "NCC Bank Limited", maxMonths: 24, logo: "/images/banks/ncc.png" },
  { id: "jamuna", name: "Jamuna Bank Limited", maxMonths: 24, logo: "/images/banks/jamuna.svg" },
  { id: "premier", name: "Premier Bank", maxMonths: 24, logo: "/images/banks/premier.svg" },
  { id: "nrb", name: "NRB Bank", maxMonths: 24, logo: "/images/banks/nrb.svg" },
  { id: "one", name: "ONE Bank Limited", maxMonths: 24, logo: "/images/banks/one.svg" },
  { id: "mercantile", name: "Mercantile Bank", maxMonths: 24, logo: "/images/banks/mercantile.jpg" },
  { id: "trust", name: "Trust Bank Limited", maxMonths: 24, logo: "/images/banks/trust.svg" },
  { id: "amex", name: "American Express (Amex)", maxMonths: 36, logo: "/images/banks/amex.svg" },
];

/**
 * Calculate EMI breakdown for a given amount and tenure
 * @param {number} amount - Base product price or order total
 * @param {number} tenure - Months (3, 6, 9, 12, 18, 24, 30, 36)
 * @param {Array} customPlans - Optional custom plan rates
 */
export function calculateEmi(amount, tenure = 12, customPlans = EMI_PLANS) {
  const baseAmount = Math.max(0, Number(amount) || 0);
  const tenureNum = Number(tenure) || 12;

  const plan = customPlans.find((p) => p.tenure === tenureNum) || {
    tenure: tenureNum,
    rate: 9.29,
    label: `${tenureNum} Months`,
  };

  const rate = Number(plan.rate) || 0;
  const bankCharge = Math.round(baseAmount * (rate / 100));
  const totalPayable = baseAmount + bankCharge;
  const monthlyInstallment = tenureNum > 0 ? Math.round(totalPayable / tenureNum) : totalPayable;

  return {
    tenure: tenureNum,
    rate,
    baseAmount,
    bankCharge,
    totalPayable,
    monthlyInstallment,
    label: plan.label || `${tenureNum} Months`,
  };
}

/**
 * Returns the lowest monthly installment for quick badge display
 */
export function getLowestMonthlyEmi(amount) {
  const p36 = calculateEmi(amount, 36);
  return p36.monthlyInstallment;
}

/**
 * Returns standard 12-month installment for default display
 */
export function getDefault12mEmi(amount) {
  const p12 = calculateEmi(amount, 12);
  return p12.monthlyInstallment;
}

