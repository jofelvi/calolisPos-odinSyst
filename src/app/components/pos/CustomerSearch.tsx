'use client';

import { Customer } from '@/types/customer';
import { useState } from 'react';
import { Card } from '@/components/shared/card/card';
import { Button } from '@/components/shared/button/Button';
import { searchCustomers } from '@/services/firebase/customersServices';
import { Input } from '@/components/shared/input/input';
import Modal from '../../../components/shared/modal';
import { customerService } from '@/services/firebase/genericServices';
import { IdentificationType } from '@/types/enumShared';
import { CustomerFormData, customerSchema } from '@/schemas/customerSchema';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomer: Customer | null;
}

export default function CustomerSearch({
  onSelectCustomer,
  selectedCustomer,
}: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Form para crear nuevo cliente
  const {
    register,
    handleSubmit: handleNewCustomerSubmit,
    formState: { errors: newCustomerErrors },
    reset: resetNewCustomerForm,
  } = useForm<CustomerFormData>({
    resolver: yupResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: null,
      address: null,
      identificationId: null,
      identificationType: null,
    },
  });

  const handleSearch = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchCustomers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = (e: React.MouseEvent, customer: Customer) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectCustomer(customer);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectCustomer(null);
  };

  const handleOpenNewCustomerModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetNewCustomerForm();
  };

  const onSubmitNewCustomer = async (data: CustomerFormData) => {
    setIsCreatingCustomer(true);
    try {
      const newCustomer = await customerService.create({
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      onSelectCustomer(newCustomer);
      handleCloseModal();
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {selectedCustomer ? (
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedCustomer.phone}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Cambiar
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Buscar cliente por nombre, teléfono o ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <Card className="p-2 max-h-60 overflow-y-auto">
                <ul className="divide-y">
                  {searchResults.map((customer) => (
                    <li key={customer.id} className="py-2">
                      <button
                        type="button"
                        className="w-full text-left hover:bg-gray-50 p-2 rounded"
                        onClick={(e) => handleSelectCustomer(e, customer)}
                      >
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-gray-600">
                          {customer.phone}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleOpenNewCustomerModal}
          >
            + Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* modal para crear nuevo cliente */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-6 w-full">
          <h2 className="text-xl font-bold mb-4">Crear Nuevo Cliente</h2>

          <form
            onSubmit={handleNewCustomerSubmit(onSubmitNewCustomer)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <Input
                {...register('name')}
                type="text"
                placeholder="Nombre del cliente"
              />
              {newCustomerErrors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {newCustomerErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Teléfono *
              </label>
              <Input
                {...register('phone')}
                type="tel"
                placeholder="Teléfono del cliente"
              />
              {newCustomerErrors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {newCustomerErrors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Identificación
              </label>
              <select
                {...register('identificationType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar tipo</option>
                <option value={IdentificationType.V}>V - Venezolano</option>
                <option value={IdentificationType.E}>E - Extranjero</option>
                <option value={IdentificationType.J}>J - Jurídico</option>
                <option value={IdentificationType.G}>G - Gubernamental</option>
              </select>
              {newCustomerErrors.identificationType && (
                <p className="text-red-500 text-sm mt-1">
                  {newCustomerErrors.identificationType.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Número de Identificación
              </label>
              <Input
                {...register('identificationId')}
                type="text"
                placeholder="Número de identificación (opcional)"
              />
              {newCustomerErrors.identificationId && (
                <p className="text-red-500 text-sm mt-1">
                  {newCustomerErrors.identificationId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Email del cliente (opcional)"
              />
              {newCustomerErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {newCustomerErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Dirección
              </label>
              <Input
                {...register('address')}
                type="text"
                placeholder="Dirección del cliente (opcional)"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingCustomer}
                className="flex-1"
              >
                {isCreatingCustomer ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
