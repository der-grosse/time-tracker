type JWTPayload = JWTPayloadV1;
type AllJWTPayloads = JWTPayloadV1;

interface JWTPayloadV1 {
  v: "2.0";
  _id: string;
  name: string;
}
