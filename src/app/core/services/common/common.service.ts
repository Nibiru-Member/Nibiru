import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  private datePipe = inject(DatePipe);
  constructor() {}

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  numberValidations(event: any): boolean {
    const input = event.target.value;
    const charCode = event.key;
    if (charCode && input.length < 2 && RegExp(/^(?:[1-9]|10)$/).test(charCode)) {
      return true;
    }
    return false;
  }

  charOnly(event: any): void {
    const charCode = event.which ? event.which : event.keyCode;
    if ((charCode < 65 || charCode > 90) && (charCode < 97 || charCode > 122)) {
      event.preventDefault();
    }
  }

  charOnlyWithSpace(event: any): void {
    const charCode = event.which ? event.which : event.keyCode;
    if ((charCode < 65 || charCode > 90) && (charCode < 97 || charCode > 122) && charCode !== 32) {
      event.preventDefault();
    }
  }

  isValidJson(data: string): boolean {
    if (data) {
      try {
        const obj = JSON.parse(data);
        if (obj && typeof obj === 'object') {
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  isEmptyObject(obj: any): boolean {
    if (obj && Object.keys(obj).length === 0) {
      return true;
    }
    return false;
  }

  parseJson(data: any): any {
    return JSON.parse(data);
  }

  validateEmail(email: string) {
    var re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  isValidCard(digits: string) {
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      let cardNum = parseInt(digits[i]);

      if ((digits.length - i) % 2 === 0) {
        cardNum = cardNum * 2;

        if (cardNum > 9) {
          cardNum = cardNum - 9;
        }
      }

      sum += cardNum;
    }

    return sum % 10 === 0;
  }

  luhnCheck(cardNumber: string): boolean {
    if (!cardNumber.length) {
      return false;
    }
    // Remove all whitespaces from card number.
    cardNumber = cardNumber.replace(/\s/g, '');

    // 1. Remove last digit;
    const lastDigit = Number(cardNumber[cardNumber.length - 1]);

    // 2. Reverse card number
    const reverseCardNumber = cardNumber
      .slice(0, cardNumber.length - 1)
      .split('')
      .reverse()
      .map((x) => Number(x));
    let sum = 0;

    // 3. + 4. Multiply by 2 every digit on odd position. Subtract 9 if digit > 9
    for (let i = 0; i <= reverseCardNumber.length - 1; i += 2) {
      reverseCardNumber[i] = reverseCardNumber[i] * 2;
      if (reverseCardNumber[i] > 9) {
        reverseCardNumber[i] = reverseCardNumber[i] - 9;
      }
    }

    // 5. Make the sum of obtained values from step 4.
    sum = reverseCardNumber.reduce((acc, currValue) => acc + currValue, 0);

    // 6. Calculate modulo 10 of the sum from step 5. and the last digit. If it's 0, you have a valid card number :)
    return (sum + lastDigit) % 10 === 0;
  }

  isValidAmexCard(cardNumber: string): boolean {
    const regex = /^(34|37)\d{13}$/;
    if (!regex.test(cardNumber)) {
      return false;
    }

    // Check the Luhn algorithm
    const reversedCardNumber = cardNumber.split('').reverse().map(Number);
    let sum = 0;
    for (let i = 0; i < reversedCardNumber.length; i++) {
      let digit = reversedCardNumber[i];
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }

    return sum % 10 === 0;
  }

  calculateTimeAgo(createdAt: string): string {
    const currentTime = new Date();
    const commentTime = new Date(createdAt);
    const timeDifference = currentTime.getTime() - commentTime.getTime();
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    if (years > 0) {
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return `${seconds} seconds ago`;
    }
  }

  convertMinutesToHours(minutes: number | string): string {
    if (typeof minutes === 'string') {
      minutes = Number(minutes);
    }

    // Ensure the value is a valid number
    if (isNaN(minutes) || minutes < 0) {
      return ''; // Return empty string for invalid input (negative or NaN)
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Constructing the result based on hours and remaining minutes
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours} h ${remainingMinutes} min`;
    } else if (hours > 0) {
      return `${hours} h`;
    } else if (remainingMinutes > 0) {
      return `${remainingMinutes} min`;
    } else {
      return ''; // In case of zero minutes
    }
  }

  formatTime(timeStr: string): string {
    if (timeStr === '0') {
      return '-'; // Return "-" if the time is "0"
    }

    // Format the time string as "09:30 AM"
    let formattedTime = '';

    if (timeStr.length === 3) {
      // Add leading zero to the hour if the time string is like "930"
      timeStr = '0' + timeStr;
    }

    // Convert the time string to Date object (assuming it's in HHMM format)
    const hour = parseInt(timeStr.substring(0, 2), 10);
    const minute = parseInt(timeStr.substring(2), 10);

    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);

    // Format using DatePipe
    formattedTime = this.datePipe.transform(date, 'hh:mm a')!;

    return formattedTime;
  }

  formatTimeDiff(value: string): string {
    if (value === null || value === undefined || value.length === 0) {
      return '-';
    }

    // Ensure the input is a valid string with 4 digits, padding if necessary
    const timeStr = value.padStart(4, '0');

    // Extract hours and minutes from the string
    const hours = timeStr.slice(0, 2); // Take first two characters as hours
    const minutes = timeStr.slice(2); // Take last two characters as minutes

    // Return the formatted string in HH.MM format
    return `${hours}.${minutes}`;
  }
}
