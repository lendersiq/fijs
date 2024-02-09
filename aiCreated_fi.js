/*
  FI.js aiCreated functions (https://fijs.net/)
*/
function aiCreated_calculateAge(openingDate) {
    let opening;

    // Regular expressions for different date formats
    const isoDateFormat = /^\d{4}-\d{2}-\d{2}$/;
    const slashDateFormat = /^\d{2}\/\d{2}\/\d{4}$/;
    const dotDateFormat = /^\d{2}\.\d{2}\.\d{4}$/;

    // Check if openingDate matches any of the date formats
    if (isoDateFormat.test(openingDate)) {
        opening = new Date(openingDate);
    } else if (slashDateFormat.test(openingDate)) {
        const parts = openingDate.split('/');
        opening = new Date(parts[2], parts[0] - 1, parts[1]);
    } else if (dotDateFormat.test(openingDate)) {
        const parts = openingDate.split('.');
        opening = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        console.error("Unsupported date format. Please use YYYY-MM-DD, MM/DD/YYYY, or DD.MM.YYYY.");
        return;
    }

    // Get the current date
    const today = new Date();

    // Calculate the age
    const ageInMilliseconds = today - opening;
    const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));

    return ageInDays;
}

