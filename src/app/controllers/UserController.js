import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  // Function to create user
  async store(req, res) {
    // Yup validation user data
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // Validation to check if user email already in use
    const userEmailExits = await User.findOne({
      where: { email: req.body.email },
    });

    if (userEmailExits) {
      return res.status(400).json({ error: 'User email already exists' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  // Function to update user data
  async update(req, res) {
    // Yup validation user data
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) => {
          return oldPassword ? field.required() : field;
        }),
      confirmPassword: Yup.string().when('password', (password, field) => {
        return password ? field.required().oneOf([Yup.ref('password')]) : field;
      }),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userEmailExits = await User.findOne({
        where: { email: req.body.email },
      });

      if (userEmailExits) {
        return res.status(400).json({ error: 'User email already exists' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = await user.update(req.body);

    return res.json({
      id,
      email,
      name,
    });
  }
}

export default new UserController();
