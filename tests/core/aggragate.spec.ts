import { Aggregate, Result, ValueObject } from "../../lib/core";
import { IResult } from "../../lib/index.types";

describe('aggregate', () => {

	describe('aggregate errors', () => {
		class AggregateErr extends Aggregate<number> {
			private constructor(props: number, id?: string) {
				super(props, id)
			}
		}

		it('should fails if static method is not defined', () => {
			expect.assertions(1);
			const result = AggregateErr.create('some value');

			expect(result.error()).toBe('Static method [create] not implemented on aggregate AggregateErr');
		});
	});

	describe('basic-aggregate', () => {

		interface Props {
			name: string;
			age: number;
		}

		class BasicAggregate extends Aggregate<Props> {
			private constructor(props: Props, id?: string) {
				super(props, id)
			}
			
			public static create(props: Props, id?: string): Result<BasicAggregate> {
				return Result.success(new BasicAggregate(props, id));
			}
		}

		it('should create a basic aggregate with success', () => {
			const agg = BasicAggregate.create({ name: 'Jane Doe', age: 21 });
	
			expect(agg.value().id).toBeDefined();

			expect(agg.value().isNew()).toBeTruthy();

			expect(agg.value().get('name')).toBe('Jane Doe');

		});

		it('should create a basic aggregate with a provided id', () => {
			const agg = BasicAggregate.create({ name: 'Jane Doe', age: 18 }, '8b51a5a2-d47a-4431-884a-4c7d77e1a201');

			expect(agg.value().isNew()).toBeFalsy();

			expect(agg.value().hashCode().value)
				.toBe('[Aggregate@]:8b51a5a2-d47a-4431-884a-4c7d77e1a201');
		});

		it('should change attributes values with default function', () => {
			const agg = BasicAggregate.create({ name: 'Jane Doe', age: 23 });

			expect(agg.value().get('name')).toBe('Jane Doe');
			expect(agg.value().get('age')).toBe(23);

			agg.value().set('age').toValue(18).set('name').toValue('Anne');
			expect(agg.value().get('age')).toBe(18);
			expect(agg.value().get('name')).toBe('Anne');

			agg.value().updateTo('age', 21).updateTo('name', 'Louse');
			expect(agg.value().get('age')).toBe(21);
			expect(agg.value().get('name')).toBe('Louse');
		});
	});

	describe('aggregate with value objects', () => {

		interface Props { value: number };

		class AgeVo extends ValueObject<Props>{
			private constructor(props: Props) {
				super(props)
			}

			public static isValidValue(value: number): boolean {
				return this.validator.number(value).isBetween(0, 130);
			}

			public static create(props: Props): IResult<ValueObject<Props>> {
				if (!this.isValidValue(props.value)) return Result.fail('Invalid value');
				return Result.success(new AgeVo(props));
			}
		}

		it('should returns false if provide a negative value', () => {
			expect(AgeVo.isValidValue(-1)).toBeFalsy();
		});

		it('should returns false if provide a value greater than 129', () => {
			expect(AgeVo.isValidValue(130)).toBeFalsy();
		});

		it('should returns true if number is greater than 0 and less than 130', () => {
			expect(AgeVo.isValidValue(1)).toBeTruthy();
			expect(AgeVo.isValidValue(129)).toBeTruthy();
		});

		interface AggProps {
			age: AgeVo;
		}
		class UserAgg extends Aggregate<AggProps>{
			private constructor(props: AggProps, id?: string) {
				super(props, id);
			}
			
			public static create(props: AggProps, id?: string): IResult<Aggregate<AggProps>> {
				return Result.success(new UserAgg(props, id));
			}
		}

		it('should create a user with success', () => {

			const age = AgeVo.create({ value: 21 }).value();
			const user = UserAgg.create({ age });

			expect(user.isSuccess()).toBeTruthy();
			
		});

		it('should get value from age with success', () => {

			const age = AgeVo.create({ value: 21 }).value();
			const user = UserAgg.create({ age }).value();

			const result = user
				.get('age')
				.get('value');

			expect(result).toBe(21);
			
		});

		it('should set a new age with success', () => {

			const age = AgeVo.create({ value: 21 }).value();
			const user = UserAgg.create({ age }).value();

			expect(user.get('age').get('value')).toBe(21);

			const age18 = AgeVo.create({ value: 18 }).value();
			const result = user
				.set('age')
				.toValue(age18);

			expect(result.get('age').get('value')).toBe(18);
			
		});

	});
});