const mapUser = (user) => {
  const data = user.toJSON ? user.toJSON() : user;

  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    phone: data.phone,
    address: data.address,
  };
};

module.exports = { mapUser };
