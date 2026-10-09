# Cedar attribution

JalNet uses the unmodified `@cedar-policy/cedar-wasm@4.13.0` package from the official [Cedar project](https://github.com/cedar-policy/cedar). AWS [open-sourced Cedar](https://aws.amazon.com/about-aws/whats-new/2023/05/cedar-open-source-language-access-control/) under Apache-2.0. JalNet's own code remains MIT.

The published npm package does not include upstream's root license/notice files. This directory retains the [LICENSE](LICENSE), [NOTICE](NOTICE), and [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt) fetched unchanged from upstream tag [cedar-policy-cli-v4.13.0](https://github.com/cedar-policy/cedar/tree/cedar-policy-cli-v4.13.0). The last file's upstream root path is a symlink to [cedar-policy-cli/THIRD_PARTY_LICENSES.txt](https://github.com/cedar-policy/cedar/blob/cedar-policy-cli-v4.13.0/cedar-policy-cli/THIRD_PARTY_LICENSES.txt); this copy retains the resolved text. Preserve these with distributions containing Cedar. The upstream third-party notice is retained in full, including entries that may not apply to this WASM build; it is not a new audit of its compiled dependency graph.

Upstream Git blob hashes: LICENSE `67db8588217f266eb561f75fae738656325deac9`; NOTICE `9649f99ac1a9978e11d23717b2db6942ca839102`; resolved THIRD_PARTY_LICENSES.txt `b2c09e76b0f05847a786a30a3337b8fdf1d045d0`. Local `git hash-object` matched all three.
