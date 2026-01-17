import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateInvoice = async (order) => {
    const doc = new jsPDF();

    // Add company logo or header
    doc.setFontSize(20);
    doc.text('FutureShop', 14, 22);
    doc.setFontSize(11);
    doc.text('Business Management System', 14, 30);
    doc.text('123 Tech Street, Silicon Valley, CA', 14, 36);
    doc.text('Email: support@futureshop.com', 14, 42);

    // Order Details
    doc.setFontSize(14);
    doc.text(`Invoice #${order.orderId || order._id}`, 140, 22);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 30);
    doc.text(`Status: ${order.orderStatus}`, 140, 36);

    // Customer Info
    doc.setFontSize(12);
    doc.text('Bill To:', 14, 55);
    doc.setFontSize(10);
    doc.text(`${order.user ? order.user.name : 'Guest'}`, 14, 62);
    doc.text(`${order.shippingInfo.address}`, 14, 68);
    doc.text(`${order.shippingInfo.city}, ${order.shippingInfo.state} ${order.shippingInfo.pinCode}`, 14, 74);
    doc.text(`Phone: ${order.shippingInfo.phoneNo}`, 14, 80);

    // Table Header
    let yPos = 100;
    doc.setFillColor(230, 230, 230);
    doc.rect(14, yPos - 5, 182, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 16, yPos);
    doc.text('Qty', 110, yPos);
    doc.text('Price', 130, yPos);
    doc.text('Total', 160, yPos);
    doc.setFont('helvetica', 'normal');

    // Table Items
    yPos += 10;
    order.orderItems.forEach(item => {
        doc.text(item.name.substring(0, 40), 16, yPos);
        doc.text(item.quantity.toString(), 110, yPos);
        doc.text(`$${item.price}`, 130, yPos);
        doc.text(`$${item.price * item.quantity}`, 160, yPos);
        yPos += 10;
    });

    // Totals
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    const rightAlign = 180;
    doc.text(`Subtotal: $${order.itemsPrice || order.totalPrice}`, rightAlign, yPos, { align: 'right' });
    yPos += 6;
    doc.text(`Tax: $${order.taxPrice}`, rightAlign, yPos, { align: 'right' });
    yPos += 6;
    doc.text(`Shipping: $${order.shippingPrice}`, rightAlign, yPos, { align: 'right' });
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total: $${order.totalPrice}`, rightAlign, yPos, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    doc.save(`invoice_${order.orderId || order._id}.pdf`);
};
