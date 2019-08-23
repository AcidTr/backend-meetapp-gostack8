module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: '<password>',
  database: 'meetapp',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
