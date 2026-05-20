import type { LucideIcon } from 'lucide-react';
import type { Order, OrderItem, User, Contract, Customer, Product, Opportunity } from '../../../types';

export type OrderDetailTab = 'MANAGEMENT' | 'FULFILLMENT' | 'EMAIL';

export type WorkflowStep = {
    id: string;
    label: string;
    icon: LucideIcon;
    status: string;
    completedAt?: string;
    disabled?: boolean;
};

export type ServiceDetailItem = {
    id: string;
    productType: string;
    productSpec: string;
    productName: string;
    serviceMethod: string;
    servicePeriod: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
};

export type OrderWithDefaults = Order & {
    items: OrderItem[];
    approvalRecords: NonNullable<Order['approvalRecords']>;
};
